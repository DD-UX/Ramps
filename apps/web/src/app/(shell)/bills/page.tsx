import { BILLS_PAGE_SIZE, countBillsByStatus, listBills } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import type { Metadata } from 'next';

import { BillsPageContent } from '@/features/bills/components/BillsPageContent';
import { getBillTabs } from '@/features/bills/data/bill-tabs.data';
import { resolveTab, statusesForTab } from '@/features/bills/helpers/bill-tabs.helpers';
import { normalizeSearchParam } from '@/features/common/helpers/search-query.helpers';

// The tab title mirrors the SideMenu label for this route ("Bill Pay").
export const metadata: Metadata = {
  title: 'Bill Pay — Ramps',
};

/**
 * /bills — Bill Pay, the product's spine.
 *
 * A Server Component, but a BOOTSTRAP, not the query-per-interaction it used
 * to be. It talks to the DB directly through the SDK's server half:
 * `createServerSupabase()` opens the admin client, `listBills` returns rows
 * already `.parse()`d against `BillListItemSchema` (the single Zod gate), and
 * `countBillsByStatus` feeds the tab badges.
 *
 * What it loads is the `?tab=` category WHOLE — no `?q=` filter, no `?page=`
 * window. `BillsPageContent` seeds that payload into the same SWR entry the
 * detail rail uses (`railBillsSwrKey`) and derives search + pagination
 * client-side; tab/search/page changes are then shallow history-API URL
 * updates that never re-run this file. This page re-runs only on a real
 * navigation (first load, a reload, `router.refresh()` after a kebab write) —
 * each time re-bootstrapping whatever category the URL names then.
 *
 * The tabs are DATA: `getBillTabs` reads the `bill_tabs` catalog (request-deduped
 * via React `cache()`), so the grouping is a DB change, not a code change.
 * `resolveTab` hardens the param — anything that isn't a real tab `code` falls
 * back to the first tab (the catalog's own default by `sort_order`), so a
 * hand-typed URL can't 500; the client derivation applies the SAME hardening
 * to the same URL, so both sides agree on the active category. `?q=` is
 * normalised here only to seed the toolbar's input — the filtering itself is
 * the client's.
 */
export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const { tab: rawTab, q: rawSearch } = await searchParams;

  const supabase = createServerSupabase();

  // The tab catalog resolves the `?tab=` code and the per-status counts feed the
  // badges — neither depends on the category list, so fetch them alongside it.
  const [tabs, countsByStatus] = await Promise.all([getBillTabs(), countBillsByStatus(supabase)]);

  const activeTab = resolveTab(tabs, rawTab);
  // The whole category — the client windows and filters it. Same unpaginated
  // contract as `GET /api/bills?statuses=…`, so the SWR entry this seeds and
  // the one revalidation refills are the same shape.
  const { bills } = await listBills(supabase, { statuses: statusesForTab(activeTab) });

  return (
    <BillsPageContent
      initialBills={bills}
      pageSize={BILLS_PAGE_SIZE}
      tabs={tabs}
      countsByStatus={countsByStatus}
      search={normalizeSearchParam(rawSearch) ?? null}
    />
  );
}
