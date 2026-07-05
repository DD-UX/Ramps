import { countBillsByStatus, listBills } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';

import { BillsPageContent } from '@/features/bills/components/BillsPageContent';
import { parseTabParam, statusesForTab } from '@/features/bills/constants/status-tabs.constants';

/**
 * /bills — Bill Pay, the product's spine.
 *
 * A Server Component that talks to the DB directly through the SDK's server
 * half: `createServerSupabase()` opens the admin client, `listBills` returns
 * rows already `.parse()`d against `BillListItemSchema` (the single Zod gate),
 * and `countBillsByStatus` feeds the tab badges. The active tab is the URL's
 * `?tab=` param — one of the five product categories — so switching tabs is a
 * navigation that re-runs this query; no client fetch, and the URL stays
 * shareable.
 *
 * `parseTabParam` hardens the param: anything that isn't one of the five tabs
 * falls back to Overview, so a hand-typed URL can't 500. The tab maps to a
 * status GROUP (`statusesForTab`) that the facade filters with `status IN (…)`.
 */
export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = parseTabParam(rawTab);

  const supabase = createServerSupabase();
  const [{ bills, total }, countsByStatus] = await Promise.all([
    listBills(supabase, { statuses: statusesForTab(tab) }),
    countBillsByStatus(supabase),
  ]);

  return (
    <BillsPageContent bills={bills} total={total} activeTab={tab} countsByStatus={countsByStatus} />
  );
}
