import { countBillsByStatus, listBills } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';

import { BillsPageContent } from '@/features/bills/components/BillsPageContent';
import { resolveTab, statusesForTab } from '@/features/bills/constants/status-tabs.constants';
import { getBillTabs } from '@/features/bills/data/bill-tabs.data';

/**
 * /bills — Bill Pay, the product's spine.
 *
 * A Server Component that talks to the DB directly through the SDK's server
 * half: `createServerSupabase()` opens the admin client, `listBills` returns
 * rows already `.parse()`d against `BillListItemSchema` (the single Zod gate),
 * and `countBillsByStatus` feeds the tab badges. The active tab is the URL's
 * `?tab=` param — a `code` from the `bill_tabs` lookup — so switching tabs is a
 * navigation that re-runs this query; no client fetch, and the URL stays
 * shareable.
 *
 * The tabs are DATA: `getBillTabs` reads the `bill_tabs` catalog (request-deduped
 * via React `cache()`), so the grouping is a DB change, not a code change.
 * `resolveTab` hardens the param — anything that isn't a real tab `code` falls
 * back to Overview, so a hand-typed URL can't 500. The resolved tab maps to a
 * status GROUP (`statusesForTab`) that the facade filters with `status IN (…)`.
 */
export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;

  const supabase = createServerSupabase();

  // The tab catalog resolves the `?tab=` code and the per-status counts feed the
  // badges — neither depends on the filtered list, so fetch them alongside it.
  const [tabs, countsByStatus] = await Promise.all([getBillTabs(), countBillsByStatus(supabase)]);

  const activeTab = resolveTab(tabs, rawTab);
  const { bills, total } = await listBills(supabase, { statuses: statusesForTab(activeTab) });

  return (
    <BillsPageContent
      bills={bills}
      total={total}
      tabs={tabs}
      activeCode={activeTab.code}
      countsByStatus={countsByStatus}
    />
  );
}
