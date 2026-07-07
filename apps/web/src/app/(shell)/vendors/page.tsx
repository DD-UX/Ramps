import { countVendorsByStatus, listVendors } from '@ramps/sdk/vendors';
import { createServerSupabase } from '@ramps/sdk/server';

import { VendorsPageContent } from '@/features/vendors/components/VendorsPageContent';
import { VENDOR_TABS } from '@/features/vendors/constants/vendor-tabs.constants';
import { normalizeSearchParam } from '@/features/vendors/helpers/vendor-search-query.helpers';
import { resolveTab, statusesForTab } from '@/features/vendors/helpers/vendor-tabs.helpers';

/**
 * /vendors — the Vendors list, built as the sibling of /bills.
 *
 * A Server Component that talks to the DB through the SDK's server half:
 * `createServerSupabase()` opens the admin client, `listVendors` returns rows
 * already `.parse()`d against `VendorListItemSchema` (the single Zod gate), and
 * `countVendorsByStatus` feeds the tab badges. The active tab is the URL's
 * `?tab=` param — a `code` from the {@link VENDOR_TABS} catalog — so switching
 * tabs re-runs this query; no client fetch, and the URL stays shareable.
 *
 * Where Bill Pay reads its tabs from the `bill_tabs` lookup table, the vendor
 * grouping (All · Active · Inactive) is a code constant — vendors have no
 * custom-view catalog — but the resolve/filter logic is identical.
 *
 * The toolbar's search is the other URL-state control: `?q=` flows into
 * `listVendors({ search })` (a `name ILIKE …`), so a search is re-run
 * server-side and stays shareable — same shape as the tabs.
 */
export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab: rawTab, q: rawSearch } = await searchParams;

  const supabase = createServerSupabase();

  const activeTab = resolveTab(VENDOR_TABS, rawTab);
  const search = normalizeSearchParam(rawSearch);

  // The per-status counts feed the tab badges; they don't depend on the
  // filtered list, so fetch them alongside it.
  const [{ vendors, total }, countsByStatus] = await Promise.all([
    listVendors(supabase, { statuses: statusesForTab(activeTab), search }),
    countVendorsByStatus(supabase),
  ]);

  return (
    <VendorsPageContent
      vendors={vendors}
      total={total}
      tabs={VENDOR_TABS}
      activeCode={activeTab.code}
      countsByStatus={countsByStatus}
      search={search ?? null}
    />
  );
}
