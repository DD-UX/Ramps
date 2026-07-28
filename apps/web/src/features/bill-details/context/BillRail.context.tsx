'use client';

import type { BillDetailRefsType } from '@ramps/schemas/bill-refs';
import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type {
  BillDetailResponseType,
  BillListItemType,
  BillStatusType,
} from '@ramps/schemas/bills';
import { useParams } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import useSWR from 'swr';

import {
  billDetailSwrKey,
  fetchRailBills,
  railBillsSwrKey,
} from '../helpers/bill-cache.helpers';
import { railStatusesFor } from '../helpers/rail.helpers';

/**
 * BillRailContext — the one client store for the `/bills/:id` surface's shared
 * data: the rail's category list, and the bill-independent server catalogs
 * (tabs, refs) the layout fetched once.
 *
 * It lives in `(detail)/bills/layout.tsx`, ABOVE the `[id]` segment — which is
 * the entire point. Partial rendering preserves the layout across bill → bill
 * navigation, so this provider (and the SWR entry it holds) survives every
 * hop: the rail repaints nothing but its highlight, scroll offset included.
 * The old design fetched the same list through the page's RSC render on every
 * navigation, to draw content identical to what was already on screen.
 *
 * HOW THE CATEGORY IS KNOWN. `railStatusesFor(tabs, status)` needs the ACTIVE
 * bill's status, which a layout above `[id]` can't read server-side. So the
 * provider resolves it from whatever the client already holds, in order:
 *  1. the active bill's detail cache entry (the RSC page STREAMS a seed into
 *     it on every navigation — cold links included), or
 *  2. the current rail list itself (a hop within the category — the clicked
 *     card IS the proof of the status).
 * Until either lands (a cold link's first moments) `statuses` is null, the
 * rail renders its own skeletons, and nothing is fetched — there is no key to
 * fetch yet.
 *
 * The category list is one SWR entry PER GROUP (`railBillsSwrKey`), fetched
 * through `GET /api/bills?statuses=…`. Navigation never refetches it — the key
 * only changes when the active bill's status maps to a DIFFERENT tab group
 * (e.g. an approve moved it), and `keepPreviousData` keeps the old list
 * painted while the new group loads. Freshness comes from focus + reconnect
 * revalidation (overriding the global focus:false — a rail left open should
 * catch up when the user returns) and from mutations reconciling the cache.
 */
export interface BillRailContextValue {
  /** The Bill Pay tab catalog — the section grouping's source of truth. */
  tabs: BillTabType[];
  /** Dropdown catalogs for the form — bill-independent, fetched by the layout. */
  refs: BillDetailRefsType;
  /** The bill the route is showing (`[id]` — the server truth, not the pill). */
  activeId: string;
  /** The active category's status arrangement, or null while still unknown. */
  statuses: readonly BillStatusType[] | null;
  /** The category's bills, due-date ordered — null until the first load lands. */
  bills: BillListItemType[] | null;
  /**
   * True until BOTH the category and its bills are known — the rail (list as
   * skeleton bars) and its Prev/Next footer (indeterminate, never "end of
   * list") read this one flag, so the two can't disagree about the state.
   */
  loading: boolean;
  /**
   * Look up one bill's rail summary — the SEED the detail screen paints from
   * while its full record streams. Null when the id isn't in the loaded list
   * (a cold deep link, or a bill from another category).
   */
  seedFor: (id: string) => BillListItemType | null;
  /**
   * The detail left pane's scrollTop, parked across bill → bill hops. It has
   * to live HERE — the whole `[id]` client tree (screen included) remounts
   * per navigation, so only this layout-level provider outlives a hop — for
   * {@link useSwapScrollTop} to glide the incoming pane back to the top.
   */
  carriedPaneScrollTopRef: RefObject<number>;
}

const BillRailContext = createContext<BillRailContextValue | null>(null);

export interface BillRailProviderProps {
  tabs: BillTabType[];
  refs: BillDetailRefsType;
  children: ReactNode;
}

/** Two status arrangements are the same category iff they list the same states in order. */
function sameStatuses(a: readonly BillStatusType[], b: readonly BillStatusType[]): boolean {
  return a.length === b.length && a.every((status, index) => status === b[index]);
}

export function BillRailProvider({ tabs, refs, children }: BillRailProviderProps) {
  const params = useParams<{ id: string }>();
  const activeId = params.id;

  // Subscribe (fetcher: null — never fetch from here) to the active bill's
  // detail entry; the RSC page streams a seed into it on every navigation.
  const { data: detailEntry } = useSWR<BillDetailResponseType | null>(
    activeId ? billDetailSwrKey(activeId) : null,
    null,
  );

  // The resolved category — STICKY state, not a derivation: it only moves when
  // the active bill's known status maps to a different group, so an id change
  // within the category can never blank the list.
  const [statuses, setStatuses] = useState<readonly BillStatusType[] | null>(null);

  const { data: bills } = useSWR(
    statuses ? railBillsSwrKey(statuses) : null,
    statuses ? () => fetchRailBills(statuses) : null,
    // A rail left open should catch up when the user comes back — the global
    // focus:false is tuned for slow catalogs, not a live worklist.
    { revalidateOnFocus: true },
  );

  // The active bill's status, from whatever the client already holds (see the
  // resolution order in the header comment).
  const knownStatus =
    detailEntry?.bill.status ??
    bills?.find((bill) => bill.id === activeId)?.status ??
    null;

  // Advance the sticky category DURING RENDER — React's "adjusting state when
  // a prop changes" pattern: the setState restarts this render before commit,
  // and the same-category guard terminates it (the re-render recomputes the
  // identical `next` and skips the set). No effect, no skeleton-frame flash
  // between "status known" and "category set".
  if (knownStatus) {
    const next = railStatusesFor(tabs, knownStatus);
    if (statuses == null || !sameStatuses(statuses, next)) setStatuses(next);
  }

  const seedFor = useCallback(
    (id: string) => bills?.find((bill) => bill.id === id) ?? null,
    [bills],
  );

  // Parked pane offset for hop-to-hop scroll continuity — see the field's
  // docblock. A ref (not state): writes happen in unmount cleanups and must
  // never re-render the rail.
  const carriedPaneScrollTopRef = useRef(0);

  const value = useMemo<BillRailContextValue>(
    () => ({
      tabs,
      refs,
      activeId,
      statuses,
      bills: bills ?? null,
      loading: bills == null || statuses == null,
      seedFor,
      carriedPaneScrollTopRef,
    }),
    [tabs, refs, activeId, statuses, bills, seedFor],
  );

  return <BillRailContext.Provider value={value}>{children}</BillRailContext.Provider>;
}

/** Read the rail store. Throws outside the provider (i.e. outside `(detail)/bills`). */
export function useBillRail(): BillRailContextValue {
  const ctx = useContext(BillRailContext);
  if (!ctx) {
    throw new Error('useBillRail must be used within a <BillRailProvider>.');
  }
  return ctx;
}
