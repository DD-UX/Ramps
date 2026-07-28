'use client';

import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import {
  fetchRailBills,
  railBillsSwrKey,
} from '@/features/bill-details/helpers/bill-cache.helpers';
import { CommonUrlNavigationProgress } from '@/features/common/components/CommonUrlNavigationProgress';
import { UrlNavigationProvider } from '@/features/common/context/UrlNavigation.context';
import { normalizeSearchParam } from '@/features/common/helpers/search-query.helpers';

import { filterBillsBySearch } from '../helpers/bill-search.helpers';
import { buildTabCounts, resolveTab, statusesForTab } from '../helpers/bill-tabs.helpers';
import { normalizePageParam } from '../helpers/page-query.helpers';
import { BillsCreateNewBillButton } from './BillsCreateNewBillButton';
import { BillsTable } from './BillsTable';
import { BillsTabs } from './BillsTabs';
import { BillsToolbar } from './BillsToolbar';

/**
 * BillsPageContent — the Bill Pay surface: the category tabs over the table.
 *
 * A client DERIVATION, not a server projection. The RSC page bootstraps ONE
 * whole category (the active tab's, unpaginated) and this component owns the
 * three URL-state controls from there:
 *
 * - `?tab=` picks the SWR entry: the same `railBillsSwrKey(statuses)` group
 *   the detail rail reads, so the two surfaces share one cache — a category
 *   the rail already loaded flips in with zero fetches, and a mutation's
 *   `reconcileBillCaches` refreshes this table for free.
 * - `?q=` filters the cached rows via {@link filterBillsBySearch} (the client
 *   mirror of the facade's ILIKE), and `?page=` windows the result — pure
 *   `slice`s, no query. The requested page is CLAMPED into the derived page
 *   count, so a narrowed result set can't strand the view past its last page.
 *
 * All three controls navigate through the SHALLOW {@link UrlNavigationProvider}:
 * the URL stays shareable/back-navigable state (this component derives
 * everything from `useSearchParams`, so back/forward just re-derives), but no
 * navigation re-runs the server. The first render needs no fetch either — the
 * bootstrap payload is the fallback for its own key and is seeded into the
 * cache (without clobbering a fresher entry) for the rail to share.
 *
 * Loading treatment: a tab whose category ISN'T cached keeps the previous rows
 * painted (`keepPreviousData`) under the sweeping progress rail — exactly the
 * treatment the rail's docblock argues for, and safe HERE because the table
 * doesn't label rows by category (unlike the detail rail's grouped headers,
 * where stale rows under new headers would lie). The SWR `isLoading` flag
 * (true only for a key with no data yet — a revalidation of the shown data
 * doesn't raise it) feeds the provider's `pending`, so the rail sweeps for
 * SWR misses just as it did for server round trips.
 */
export interface BillsPageContentProps {
  /**
   * The active tab's WHOLE category from the RSC bootstrap — fallback for the
   * first paint, then seeded into the shared SWR entry.
   */
  initialBills: BillListItemType[];
  /** Rows per page for the client-side window. */
  pageSize: number;
  /** The tab catalog from the `bill_tabs` lookup, in display order. */
  tabs: BillTabType[];
  /** Per-state counts from the server, rolled up here into per-tab badges. */
  countsByStatus: Partial<Record<BillStatusType, number>>;
  /** The `?q=` term the page loaded with — seeds the toolbar's search field. */
  search: BillListItemType['invoice_number'];
}

export function BillsPageContent({
  initialBills,
  pageSize,
  tabs,
  countsByStatus,
  search,
}: BillsPageContentProps) {
  const searchParams = useSearchParams();
  const { mutate } = useSWRConfig();

  // ?tab= → the category → the shared SWR key. Same hardening as the server:
  // an unknown code falls back to the catalog's first tab.
  const activeTab = resolveTab(tabs, searchParams.get('tab') ?? undefined);
  const statuses = statusesForTab(activeTab);
  const key = railBillsSwrKey(statuses);

  // The key at FIRST render is the one the server bootstrapped (same URL on
  // both sides), so `initialBills` is only ever the fallback for that key.
  // `useState` (never set) pins it render-safely — a ref can't be read during
  // render under the react-hooks/refs rule.
  const [initialKey] = useState(key);
  const { data, isLoading } = useSWR(key, () => fetchRailBills(statuses), {
    fallbackData: key === initialKey ? initialBills : undefined,
    keepPreviousData: true,
    // A worklist left open should catch up on return — same override as the rail.
    revalidateOnFocus: true,
  });

  // Seed the bootstrap payload into the CACHE (fallbackData is hook-local) so
  // the detail rail finds the category warm. `current ??` keeps a fresher
  // entry — e.g. the rail's own fetch on a back-nav — from being clobbered.
  useEffect(() => {
    // Every dep is render-stable (the pinned key, the RSC payload, SWR's
    // mutate), so this seeds once per bootstrap; later payloads arrive via
    // revalidation.
    void mutate<BillListItemType[]>(initialKey, (current) => current ?? initialBills, {
      revalidate: false,
    });
  }, [mutate, initialKey, initialBills]);

  // ?q= narrows, ?page= windows — both over rows already in hand.
  const term = normalizeSearchParam(searchParams.get('q') ?? undefined);
  const filtered = filterBillsBySearch(data ?? [], term);
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(normalizePageParam(searchParams.get('page') ?? undefined), pageCount);
  const pageBills = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Roll the per-status counts up into each tab's badge, keyed by tab code.
  const tabCounts = buildTabCounts(tabs, countsByStatus);

  return (
    <div className="bg-white flex flex-1 flex-col">
      <UrlNavigationProvider shallow pending={isLoading}>
        <div className="pt-rui-6">
          <div className="px-rui-6 flex items-start justify-between">
            <h2 className="font-heading text-3xl text-ink">Bill Pay</h2>
            {/* Self-contained "Create demo bill" CTA — mints another demo bill to
                test with, no props, owns its own loading + navigation. */}
            <BillsCreateNewBillButton />
          </div>
          <BillsTabs tabs={tabs} activeCode={activeTab.code} counts={tabCounts} />
        </div>
        <BillsToolbar initialSearch={search} />
        {/* The activity rail sits directly under the filter strip and spans the
            content width — the region below it is what refreshes. It always
            occupies its 2px, so starting a load never nudges the table. */}
        <CommonUrlNavigationProgress />
        <BillsTable bills={pageBills} total={total} page={page} pageSize={pageSize} />
      </UrlNavigationProvider>
    </div>
  );
}
