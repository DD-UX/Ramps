import { createServerSupabase } from '@ramps/sdk/server';
import { listVendors } from '@ramps/sdk/vendors';

import { VendorsPageContent } from '@/features/vendors/components/VendorsPageContent';
import { VENDOR_TABS } from '@/features/vendors/constants/vendor-tabs.constants';
import { normalizeSearchParam } from '@/features/vendors/helpers/vendor-search-query.helpers';
import { resolveTab, reviewStatesForTab } from '@/features/vendors/helpers/vendor-tabs.helpers';

/**
 * /vendors — the Vendors list, built as the sibling of /bills.
 *
 * A Server Component that talks to the DB through the SDK's server half:
 * `createServerSupabase()` opens the admin client and `listVendors` returns
 * rows already `.parse()`d against `VendorListItemSchema` (the single Zod gate),
 * with each vendor's `total_spend_cents` summed from its bills. The active tab
 * is the URL's `?tab=` param — a `code` from the {@link VENDOR_TABS} catalog —
 * so switching tabs re-runs this query; no client fetch, and the URL stays
 * shareable.
 *
 * Where Bill Pay reads its tabs from the `bill_tabs` lookup table, the vendor
 * workflow tabs (Overview · Needs review · Renewals · Duplicates · Switch
 * cards) are a code constant — vendors have no custom-view catalog — but the
 * resolve/filter logic is identical: each tab maps to a `review_state` bucket.
 * The non-Overview buckets have no seeded rows yet, so they render empty by
 * design.
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

  const { vendors, total } = await listVendors(supabase, {
    reviewStates: reviewStatesForTab(activeTab),
    search,
  });

  return (
    <VendorsPageContent
      vendors={vendors}
      total={total}
      tabs={VENDOR_TABS}
      activeCode={activeTab.code}
      search={search ?? null}
    />
  );
}
