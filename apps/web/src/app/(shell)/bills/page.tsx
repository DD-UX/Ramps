import { BILLS_PAGE_SIZE, countBillsByStatus, listBills } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import type { Metadata } from 'next';

import { BillsPageContent } from '@/features/bills/components/BillsPageContent';
import { getBillTabs } from '@/features/bills/data/bill-tabs.data';
import { resolveTab, statusesForTab } from '@/features/bills/helpers/bill-tabs.helpers';
import { normalizePageParam } from '@/features/bills/helpers/page-query.helpers';
import { normalizeSearchParam } from '@/features/bills/helpers/search-query.helpers';

// The tab title mirrors the SideMenu label for this route ("Bill Pay").
export const metadata: Metadata = {
  title: 'Bill Pay — Ramps',
};

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
 * back to the first tab (the catalog's own default by `sort_order`), so a
 * hand-typed URL can't 500. The resolved tab maps to a status GROUP
 * (`statusesForTab`) that the facade filters with `status IN (…)`.
 *
 * The toolbar's search is the other URL-state control: `?q=` flows into
 * `listBills({ search })` (a `col ILIKE …` across the bill's own columns), so a
 * search is re-run server-side and stays shareable — same shape as the tabs.
 *
 * Pagination is the third: `?page=` (1-based, normalised) windows the query to
 * one page of `BILLS_PAGE_SIZE` via the facade's `.range()`. The returned
 * `total` stays the full filtered count, so the footer's "X–Y of N" and the
 * page picker are correct. Switching tab or changing the search resets to
 * page 1 (the tab href / search query drop `?page=`), so a stale page never
 * points past the new result set.
 */
export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const { tab: rawTab, q: rawSearch, page: rawPage } = await searchParams;

  const supabase = createServerSupabase();

  // The tab catalog resolves the `?tab=` code and the per-status counts feed the
  // badges — neither depends on the filtered list, so fetch them alongside it.
  const [tabs, countsByStatus] = await Promise.all([getBillTabs(), countBillsByStatus(supabase)]);

  const activeTab = resolveTab(tabs, rawTab);
  const search = normalizeSearchParam(rawSearch);
  const page = normalizePageParam(rawPage);
  const { bills, total } = await listBills(supabase, {
    statuses: statusesForTab(activeTab),
    search,
    page,
    pageSize: BILLS_PAGE_SIZE,
  });

  return (
    <BillsPageContent
      bills={bills}
      total={total}
      page={page}
      pageSize={BILLS_PAGE_SIZE}
      tabs={tabs}
      activeCode={activeTab.code}
      countsByStatus={countsByStatus}
      search={search ?? null}
    />
  );
}
