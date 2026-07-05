import { countBillsByStatus, listBills } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';

import { BillsPageContent } from '@/features/bills/components/BillsPageContent';
import { parseStatusParam } from '@/features/bills/constants/status-tabs.constants';

/**
 * /bills — Bill Pay, the product's spine.
 *
 * A Server Component that talks to the DB directly through the SDK's server
 * half: `createServerSupabase()` opens the admin client, `listBills` returns
 * rows already `.parse()`d against `BillListItemSchema` (the single Zod gate),
 * and `countBillsByStatus` feeds the tab badges. The active tab is the URL's
 * `?status=` param, so switching tabs is a navigation that re-runs this query —
 * no client fetch, and the URL stays shareable.
 *
 * `parseStatusParam` hardens the param: any value that isn't a real lifecycle
 * state falls back to the unfiltered list, so a hand-typed URL can't 500.
 */
export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const status = parseStatusParam(rawStatus);

  const supabase = createServerSupabase();
  const [{ bills, total }, countsByStatus] = await Promise.all([
    listBills(supabase, { status }),
    countBillsByStatus(supabase),
  ]);

  return (
    <BillsPageContent
      bills={bills}
      total={total}
      activeStatus={status ?? 'all'}
      countsByStatus={countsByStatus}
    />
  );
}
