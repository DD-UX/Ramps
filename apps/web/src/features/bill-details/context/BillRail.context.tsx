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
  useEffect,
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
import {
  chevronCandidates,
  chevronRing,
  type ChevronState,
  type ChevronTarget,
  resolveChevronState,
  sameStatuses,
} from '../helpers/chevron.helpers';
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
 *     card IS the proof of the status), or
 *  3. any WARMED neighbor list (a chevron hop's landing — including the
 *     guard modal's programmatic navigations, which skip the chevron's
 *     onClick entirely).
 * Until one lands (a cold link's first moments) `statuses` is null, the
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
  /**
   * The SHOWN category's status arrangement, or null while still unknown.
   * Usually the active bill's resolved category; during a chevron hop it is
   * the flip target's — the optimistic frame — until resolution catches up.
   */
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
   * while its full record streams. Searches the active category first, then
   * every WARMED neighbor category (so a chevron hop's landing bill seeds
   * before its category is even active). Null when no loaded list knows the
   * id (a cold deep link).
   */
  seedFor: (id: string) => BillListItemType | null;
  /**
   * The `<` / `>` category steppers' state (see `chevron.helpers`): the
   * nearest non-empty category in each direction with the bill the hop lands
   * on, `settled: false` while a candidate list is still warming, and a
   * settled null target at a true end — the clamp.
   */
  chevronPrev: ChevronState;
  chevronNext: ChevronState;
  /**
   * Flip the rail to a chevron target's category NOW — the optimistic half of
   * a chevron hop, called from the chevron's `onClick` (which only fires when
   * the unsaved-changes guard lets the click through — a vetoed click never
   * flips, so there is nothing to roll back). The flip retires on its own
   * when the landed route's status resolution catches up (or contradicts it).
   */
  flipCategory: (target: ChevronTarget) => void;
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

/**
 * RailCategoryWarmer — one invisible SWR subscription per NEIGHBOR category.
 *
 * Rendered by the provider for every chevron-eligible category, it
 * background-fetches the category's list into the SAME `railBillsSwrKey`
 * entry the rail reads. One investment, three payoffs: the chevrons know
 * their target id + label immediately, a chevron hop's landing rail paints
 * with zero network, and the extended `seedFor` hands the landing detail its
 * seed tier. The list is REPORTED up (an effect, not a render-time read) so
 * the provider can fold all warmed lists into one synchronous view without a
 * hooks-in-a-loop.
 */
function RailCategoryWarmer({
  statuses,
  onList,
}: {
  statuses: readonly BillStatusType[];
  onList: (key: string, list: BillListItemType[]) => void;
}) {
  const key = railBillsSwrKey(statuses);
  const { data } = useSWR(key, () => fetchRailBills(statuses));
  useEffect(() => {
    if (data) onList(key, data);
  }, [key, data, onList]);
  return null;
}

/** A chevron before its answer is knowable — stable identity so renders can share it. */
const UNRESOLVED: ChevronState = { target: null, settled: false };

/** The bill's status from whichever warmed list knows it — rung 3 of the status resolution. */
function warmStatusFor(
  warmLists: Record<string, BillListItemType[]>,
  id: string,
): BillStatusType | null {
  for (const list of Object.values(warmLists)) {
    const found = list.find((bill) => bill.id === id);
    if (found) return found.status;
  }
  return null;
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

  // The warmed neighbor lists, keyed by their `railBillsSwrKey` — the
  // provider's synchronous view of what the warmers below have landed. A
  // report is identity-guarded so a revalidation that returns the same array
  // doesn't loop a render. Declared BEFORE the sticky category: the warm
  // lists are rung 3 of the status resolution below.
  const [warmLists, setWarmLists] = useState<Record<string, BillListItemType[]>>({});
  const reportWarmList = useCallback((key: string, list: BillListItemType[]) => {
    setWarmLists((prev) => (prev[key] === list ? prev : { ...prev, [key]: list }));
  }, []);

  // The resolved category — STICKY state, not a derivation: it only moves when
  // the active bill's known status maps to a different group, so an id change
  // within the category can never blank the list.
  const [statuses, setStatuses] = useState<readonly BillStatusType[] | null>(null);

  // The optimistic chevron flip: the category to show NOW, plus the sticky
  // identity it superseded (`from`) so the retire effect below can tell
  // "resolution caught up" apart from "still waiting". Null whenever the rail
  // simply shows the resolved category.
  const [pendingFlip, setPendingFlip] = useState<{
    statuses: readonly BillStatusType[];
    billId: string;
    from: readonly BillStatusType[] | null;
  } | null>(null);
  const flipCategory = useCallback(
    (target: ChevronTarget) => {
      setPendingFlip({ statuses: target.tab.statuses, billId: target.billId, from: statuses });
    },
    [statuses],
  );

  // What the rail actually shows: an alive flip wins over the sticky category.
  const shownStatuses = pendingFlip?.statuses ?? statuses;

  const { data: bills } = useSWR(
    shownStatuses ? railBillsSwrKey(shownStatuses) : null,
    shownStatuses ? () => fetchRailBills(shownStatuses) : null,
    // A rail left open should catch up when the user comes back — the global
    // focus:false is tuned for slow catalogs, not a live worklist. NOTE: no
    // keepPreviousData here — the rail labels rows with category headers, so
    // painting the OLD category's bills under a flipped header would lie;
    // honest skeletons (the `loading` flag) cover the gap instead.
    { revalidateOnFocus: true },
  );

  // The active bill's status, from whatever the client already holds (see the
  // resolution order in the header comment).
  const knownStatus =
    detailEntry?.bill.status ??
    bills?.find((bill) => bill.id === activeId)?.status ??
    warmStatusFor(warmLists, activeId);

  // Advance the sticky category DURING RENDER — React's "adjusting state when
  // a prop changes" pattern: the setState restarts this render before commit,
  // and the same-category guard terminates it (the re-render recomputes the
  // identical `next` and skips the set). No effect, no skeleton-frame flash
  // between "status known" and "category set".
  if (knownStatus) {
    const next = railStatusesFor(tabs, knownStatus);
    if (statuses == null || !sameStatuses(statuses, next)) setStatuses(next);
  }

  // Retire the flip once the sticky category MOVES — fulfilled or contradicted
  // alike. The sticky identity only ever changes on a real category change, so
  // `statuses !== pendingFlip.from` is exactly "the resolution has spoken
  // since the flip"; until then the flip keeps the optimistic category up.
  // Same render-time adjustment pattern as the sticky advance above (often the
  // very render that advance restarted), so the flip retires in the same
  // commit the resolved category paints — no one-frame double take.
  if (pendingFlip && statuses !== pendingFlip.from) {
    setPendingFlip(null);
  }

  // Every chevron-eligible category gets a warmer — the whitelist ring from
  // chevron.helpers, resolved against the catalog. The ACTIVE category is
  // included harmlessly: SWR dedupes the key with the main subscription
  // above, and its report just mirrors `bills`.
  const warmTabs = useMemo(() => chevronRing(tabs), [tabs]);

  // The chevrons' state: candidates in each direction from the CURRENT
  // category, then the skip-empty walk over whatever has warmed. While the
  // category itself is unknown the chevrons are UNSETTLED, not clamped —
  // walking zero candidates would return a "you're at the edge" verdict that
  // loading has no business passing.
  const listForTab = useCallback(
    (tab: BillTabType) => warmLists[railBillsSwrKey(tab.statuses)],
    [warmLists],
  );
  const candidates = shownStatuses ? chevronCandidates(tabs, shownStatuses) : null;
  const chevronPrev = candidates ? resolveChevronState(candidates.prev, listForTab) : UNRESOLVED;
  const chevronNext = candidates ? resolveChevronState(candidates.next, listForTab) : UNRESOLVED;

  const seedFor = useCallback(
    (id: string) => {
      const active = bills?.find((bill) => bill.id === id);
      if (active) return active;
      // Not in the active category — a chevron hop mid-flight. The warmed
      // neighbor lists are the same rail summaries, so they seed identically.
      for (const list of Object.values(warmLists)) {
        const warm = list.find((bill) => bill.id === id);
        if (warm) return warm;
      }
      return null;
    },
    [bills, warmLists],
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
      statuses: shownStatuses,
      bills: bills ?? null,
      loading: bills == null || shownStatuses == null,
      seedFor,
      chevronPrev,
      chevronNext,
      flipCategory,
      carriedPaneScrollTopRef,
    }),
    [tabs, refs, activeId, shownStatuses, bills, seedFor, chevronPrev, chevronNext, flipCategory],
  );

  return (
    <BillRailContext.Provider value={value}>
      {warmTabs.map((tab) => (
        <RailCategoryWarmer key={tab.id} statuses={tab.statuses} onList={reportWarmList} />
      ))}
      {children}
    </BillRailContext.Provider>
  );
}

/** Read the rail store. Throws outside the provider (i.e. outside `(detail)/bills`). */
export function useBillRail(): BillRailContextValue {
  const ctx = useContext(BillRailContext);
  if (!ctx) {
    throw new Error('useBillRail must be used within a <BillRailProvider>.');
  }
  return ctx;
}
