'use client';

import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import {
  billsListSwrKey,
  fetchBillsList,
  railBillsSwrKey,
} from '@/features/bill-details/helpers/bill-cache.helpers';
import { CommonUrlNavigationProgress } from '@/features/common/components/CommonUrlNavigationProgress';
import { UrlNavigationProvider } from '@/features/common/context/UrlNavigation.context';
import { normalizeSearchParam } from '@/features/common/helpers/search-query.helpers';

import { buildTabCounts, resolveTab, statusesForTab } from '../helpers/bill-tabs.helpers';
import { buildPageQuery, normalizePageParam } from '../helpers/page-query.helpers';
import { BillsCreateNewBillButton } from './BillsCreateNewBillButton';
import { BillsTable } from './BillsTable';
import { BillsTabs } from './BillsTabs';
import { BillsToolbar } from './BillsToolbar';

/**
 * BillsPageContent — the Bill Pay surface: the category tabs over the table.
 *
 * The URL is the query. `?tab=` (the category), `?q=` (the search) and
 * `?page=` (the window) TOGETHER name one server result, and this component
 * fetches exactly that: the three params key one SWR entry
 * ({@link billsListSwrKey}) whose fetcher runs the SAME filtered, windowed
 * query the RSC bootstrap ran (`GET /api/bills?statuses&q&page&pageSize`).
 * Filtering and pagination are the SERVER's — no client-side `.filter()` or
 * `.slice()` — so the table scales past what one payload can carry, and a
 * deeplink to any tab+search+page combination reproduces the identical view.
 *
 * All three controls still navigate through the SHALLOW
 * {@link UrlNavigationProvider}: the URL stays shareable/back-navigable state
 * (this component derives everything from `useSearchParams`, so back/forward
 * just re-derives), and no navigation re-runs the RSC — the changed URL
 * re-keys the cache and the API route answers. The first render needs no
 * fetch: the bootstrap payload (already the URL's exact window) is the
 * fallback for its own key.
 *
 * Loading treatment — ONE treatment for tab, search and page changes alike: a
 * window that isn't cached keeps the previous rows painted
 * (`keepPreviousData`) under the sweeping progress rail. The SWR `isLoading`
 * flag (true only for a key with no data yet — a revalidation of the shown
 * data doesn't raise it) feeds the provider's `pending`, so every URL change
 * that actually needs the server sweeps the rail, and a return to a cached
 * window flips instantly, silent.
 *
 * Two side jobs:
 * - A page past the end (a stale deeplink; the last row of a page archived)
 *   HEALS: the fetch comes back empty but with the true `total`, and the
 *   clamp effect rewrites `?page=` to the real last page — a replace, not a
 *   push, so Back doesn't revisit the phantom page.
 * - The detail rail's cache still gets its warm start, but ONLY when the
 *   bootstrap payload is provably the whole category (no search, one full
 *   window) — a filtered or windowed page must never masquerade as a rail
 *   group.
 */
export interface BillsPageContentProps {
  /** The URL's exact window from the RSC bootstrap — fallback for the first paint. */
  initialBills: BillListItemType[];
  /** The bootstrap's FULL filtered count (not the window's length). */
  initialTotal: number;
  /** Rows per page — the window size every fetch asks the server for. */
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
  initialTotal,
  pageSize,
  tabs,
  countsByStatus,
  search,
}: BillsPageContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mutate } = useSWRConfig();

  // ?tab= → the category, with the same hardening as the server: an unknown
  // code falls back to the catalog's first tab. ?q= and ?page= run through
  // the same normalizers the RSC and the API route apply, so every transport
  // agrees on the view a URL names.
  const activeTab = resolveTab(tabs, searchParams.get('tab') ?? undefined);
  const statuses = statusesForTab(activeTab);
  const term = normalizeSearchParam(searchParams.get('q') ?? undefined) ?? null;
  const page = normalizePageParam(searchParams.get('page') ?? undefined);
  const key = billsListSwrKey(statuses, term, page);

  // The key at FIRST render is the one the server bootstrapped (same URL on
  // both sides), so the bootstrap payload is only ever the fallback for that
  // key. `useState` (never set) pins it render-safely — a ref can't be read
  // during render under the react-hooks/refs rule.
  const [initialKey] = useState(key);
  const [initialRailKey] = useState(() => railBillsSwrKey(statuses));
  const { data, isLoading } = useSWR(key, () => fetchBillsList(statuses, term, page, pageSize), {
    fallbackData: key === initialKey ? { bills: initialBills, total: initialTotal } : undefined,
    keepPreviousData: true,
    // A worklist left open should catch up on return — same override as the rail.
    revalidateOnFocus: true,
  });

  const bills = data?.bills ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Heal a stranded ?page= — a deeplink past the end, or the last row of the
  // final page moving category under a mutation. The empty fetch still
  // carries the true total, so rewrite the URL to the real last page (a
  // REPLACE — the phantom page mustn't survive in back-history) and let the
  // re-key fetch it under the rail sweep.
  useEffect(() => {
    if (!data || page <= pageCount) return;
    const query = buildPageQuery(searchParams.toString(), pageCount);
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname);
  }, [data, page, pageCount, searchParams, pathname]);

  // Give the detail rail its warm start — but only when the bootstrap payload
  // IS the whole category: unsearched, and one window that holds every row
  // (`length === total`; an out-of-range window can't fake this, its length
  // is 0 against a non-zero total). A partial page seeded as a rail group
  // would silently amputate the rail. `current ??` keeps a fresher entry —
  // e.g. the rail's own fetch on a back-nav — from being clobbered.
  useEffect(() => {
    if (search != null || initialBills.length !== initialTotal) return;
    void mutate<BillListItemType[]>(initialRailKey, (current) => current ?? initialBills, {
      revalidate: false,
    });
  }, [mutate, initialRailKey, initialBills, initialTotal, search]);

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
        <BillsTable
          bills={bills}
          total={total}
          page={Math.min(page, pageCount)}
          pageSize={pageSize}
        />
      </UrlNavigationProvider>
    </div>
  );
}
