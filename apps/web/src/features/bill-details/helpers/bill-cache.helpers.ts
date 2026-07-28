import {
  BillDetailResponseSchema,
  type BillDetailResponseType,
  type BillDetailType,
  type BillListItemType,
  BillListResponseSchema,
  type BillListResponseType,
  type BillStatusType,
} from '@ramps/schemas/bills';
import type { ScopedMutator } from 'swr';

/**
 * The client cache contract for the bill surfaces — the SWR keys and fetchers
 * behind the detail rail's category list, the bill detail, AND the Bill Pay
 * table's server-windowed pages.
 *
 * One rule shapes the rail/detail halves: NAVIGATION NEVER FETCHES. The
 * rail's group is fetched once per category and every bill → bill hop just
 * moves the active highlight over data already held; the detail is seeded
 * (streamed by the RSC page, or synthesized from the rail item) and those
 * fetchers exist to REVALIDATE — focus, reconnect, a mutation reconciling —
 * not to gate paint.
 *
 * The LIST half is the deliberate exception: the Bill Pay table is
 * server-filtered and server-paginated, so its key carries the whole query
 * (category + `?q=` + `?page=`) and changing any of them IS a fetch — cached
 * under the sweeping progress rail, exactly the tab-switch treatment. All
 * fetchers parse the wire shape against the schema SSoT, so the client cache
 * can only ever hold validated models, same as the server loaders.
 */

/**
 * SWR key for one rail category — the bills of one status group, due-date
 * ordered. Keyed by the GROUP (never the active bill's id): two bills in the
 * same category provably share a rail list (`railStatusesFor` reads only the
 * status), so hopping between them hits the SAME cache entry and repaints
 * nothing but the highlight.
 */
const RAIL_BILLS_PREFIX = 'RAIL_BILLS:';

export function railBillsSwrKey(statuses: readonly BillStatusType[]): string {
  return `${RAIL_BILLS_PREFIX}${statuses.join(',')}`;
}

/**
 * SWR key for one Bill Pay table WINDOW — one server-filtered, server-windowed
 * page of a category. Unlike the rail's per-category key, the whole query is
 * the identity: the category (`?tab=`'s statuses), the search term (`?q=`) and
 * the page (`?page=`) each name a DIFFERENT server result, so each gets its
 * own entry — flipping any of them is a key change, which is what raises SWR's
 * `isLoading` and sweeps the progress rail, the same loading treatment a tab
 * switch gets.
 */
const BILLS_LIST_PREFIX = 'BILLS_LIST:';

export function billsListSwrKey(
  statuses: readonly BillStatusType[],
  term: string | null,
  page: number,
): string {
  return `${BILLS_LIST_PREFIX}${statuses.join(',')}|q=${term ?? ''}|page=${page}`;
}

/**
 * SWR key for one bill's full detail (+ its resolved document URL). Entries
 * are seeded by the RSC page's streamed read and revalidated through
 * `GET /api/bills/:id`; mutations overwrite them with the re-read bill every
 * write already returns.
 */
export function billDetailSwrKey(id: string): string {
  return `BILL_DETAIL:${id}`;
}

/**
 * Reconcile the client caches after a WRITE to one bill — the single follow-up
 * every mutation hook calls in place of the old whole-tree `router.refresh()`.
 *
 * Two moves, one per cache the write can invalidate:
 * - the bill's own detail entry. Every mutation endpoint already RETURNS the
 *   re-read bill, so when the caller hands it over the entry is SEEDED with
 *   it (`revalidate: false`) — the screen flips to post-write truth in the
 *   same paint, no second roundtrip between the POST settling and the UI
 *   catching up. The seed is an updater so the cached `documentUrl` (resolved
 *   server-side, not part of the mutation response) rides along untouched.
 *   Without a bill — a caller whose response may already be stale again, like
 *   a save chased by a stages write — the entry revalidates instead:
 *   `mutate(key)` re-runs the detail hook's bound fetcher.
 * - EVERY rail category list AND every Bill Pay table window, by key-filter:
 *   a write that moves a bill's status moves it BETWEEN groups, so both the
 *   group it left and the group it joined are stale — and which pair that is
 *   isn't this helper's business. The table's windows are just as stale (the
 *   row leaves one tab's pages and joins another's, shifting counts and
 *   windows), so the same filter sweeps both prefixes. Non-mounted categories
 *   and windows hold no entries, so the filter touches exactly what's alive.
 *   This revalidation is also the seeded path's safety net: if a seed ever
 *   disagrees with the server, the next rail read and the detail's focus
 *   revalidation converge on truth.
 *
 * Takes the caller's scoped `mutate` (from `useSWRConfig()`) rather than being
 * a hook itself, so plain async flows can call it after their POST settles.
 *
 * Never rejects: a failed revalidation just leaves an entry at its current
 * value (the write itself already succeeded), and the focus / reconnect
 * revalidation recovers it — the caller's success path must not turn into an
 * error line over a refresh.
 */
export async function reconcileBillCaches(
  mutate: ScopedMutator,
  id: string,
  bill?: BillDetailType,
): Promise<void> {
  const detail = bill
    ? mutate<BillDetailResponseType | null>(
        billDetailSwrKey(id),
        (current) => ({ bill, documentUrl: current?.documentUrl ?? null }),
        { revalidate: false },
      )
    : mutate(billDetailSwrKey(id));
  await Promise.all([
    detail.catch(() => undefined),
    mutate(
      (key) =>
        typeof key === 'string' &&
        (key.startsWith(RAIL_BILLS_PREFIX) || key.startsWith(BILLS_LIST_PREFIX)),
    ).catch(() => undefined),
  ]);
}

/**
 * Fetch one Bill Pay table window through `GET /api/bills`, validated — the
 * server-filtered (`q`), server-windowed (`page` × `pageSize`) page of one
 * category, WITH the full filtered `total` for the footer's "X–Y of N". The
 * same endpoint the rail revalidates through; this caller just asks for a
 * window of it instead of the whole category.
 */
export async function fetchBillsList(
  statuses: readonly BillStatusType[],
  term: string | null,
  page: number,
  pageSize: number,
): Promise<BillListResponseType> {
  const params = new URLSearchParams({ statuses: statuses.join(',') });
  if (term) params.set('q', term);
  if (page > 1) params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  const response = await fetch(`/api/bills?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load bills (${response.status})`);
  }
  return BillListResponseSchema.parse(await response.json());
}

/** Fetch one rail category through `GET /api/bills?statuses=…`, validated. */
export async function fetchRailBills(
  statuses: readonly BillStatusType[],
): Promise<BillListItemType[]> {
  const params = new URLSearchParams({ statuses: statuses.join(',') });
  const response = await fetch(`/api/bills?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load rail bills (${response.status})`);
  }
  return BillListResponseSchema.parse(await response.json()).bills;
}

/**
 * Fetch one bill's detail through `GET /api/bills/:id`, validated. Resolves
 * `null` on 404 — the same "no such bill" value the server seed streams — so
 * the screen has ONE not-found signal regardless of which path answered.
 */
export async function fetchBillDetail(id: string): Promise<BillDetailResponseType | null> {
  const response = await fetch(`/api/bills/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load bill ${id} (${response.status})`);
  }
  return BillDetailResponseSchema.parse(await response.json());
}
