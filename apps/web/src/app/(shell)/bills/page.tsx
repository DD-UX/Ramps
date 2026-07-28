import { BILLS_PAGE_SIZE, countBillsByStatus, listBills } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import type { Metadata } from 'next';

import { BillsPageContent } from '@/features/bills/components/BillsPageContent';
import { getBillTabs } from '@/features/bills/data/bill-tabs.data';
import { resolveTab, statusesForTab } from '@/features/bills/helpers/bill-tabs.helpers';
import { normalizePageParam } from '@/features/bills/helpers/page-query.helpers';
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
 * What it loads is exactly what the URL names: the `?tab=` category, filtered
 * by `?q=` and windowed to `?page=` — the SAME query `GET /api/bills` runs for
 * the client, so a deeplink to `/bills?tab=for_approval&q=acme&page=2`
 * reproduces that precise view on first paint. `BillsPageContent` seeds the
 * payload as the fallback for its own SWR window key; tab/search/page changes
 * are then shallow history-API URL updates that never re-run this file — each
 * re-keys the client cache and fetches the new window through the API route.
 * This page re-runs only on a real navigation (first load, a reload,
 * `router.refresh()` after a kebab write) — each time re-bootstrapping
 * whatever view the URL names then.
 *
 * The tabs are DATA: `getBillTabs` reads the `bill_tabs` catalog (request-deduped
 * via React `cache()`), so the grouping is a DB change, not a code change.
 * `resolveTab` hardens the param — anything that isn't a real tab `code` falls
 * back to the first tab (the catalog's own default by `sort_order`), so a
 * hand-typed URL can't 500; the client derivation applies the SAME hardening
 * (and the same `?q=`/`?page=` normalizers) to the same URL, so both sides
 * agree on the view.
 */
export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const { tab: rawTab, q: rawSearch, page: rawPage } = await searchParams;

  const supabase = createServerSupabase();

  // The tab catalog resolves the `?tab=` code and the per-status counts feed the
  // badges — neither depends on the category list, so fetch them alongside it.
  const [tabs, countsByStatus] = await Promise.all([getBillTabs(), countBillsByStatus(supabase)]);

  const activeTab = resolveTab(tabs, rawTab);
  const search = normalizeSearchParam(rawSearch);
  const page = normalizePageParam(rawPage);
  // The URL's window of the category — searched and paginated ON the server;
  // `total` is the full filtered count for the footer's "X–Y of N".
  const { bills, total } = await listBills(supabase, {
    statuses: statusesForTab(activeTab),
    search,
    page,
    pageSize: BILLS_PAGE_SIZE,
  });

  return (
    <BillsPageContent
      initialBills={bills}
      initialTotal={total}
      pageSize={BILLS_PAGE_SIZE}
      tabs={tabs}
      countsByStatus={countsByStatus}
      search={search ?? null}
    />
  );
}
