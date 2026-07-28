import {
  BillDetailResponseSchema,
  type BillDetailResponseType,
  type BillListItemType,
  BillListResponseSchema,
  type BillStatusType,
} from '@ramps/schemas/bills';
import type { ScopedMutator } from 'swr';

/**
 * The client cache contract for the `/bills/:id` surface — the SWR keys and
 * fetchers behind the rail's category list and the bill detail.
 *
 * One rule shapes both halves: NAVIGATION NEVER FETCHES. The rail's group is
 * fetched once per category and every bill → bill hop just moves the active
 * highlight over data already held; the detail is seeded (streamed by the RSC
 * page, or synthesized from the rail item) and the fetchers below exist to
 * REVALIDATE — focus, reconnect, a mutation reconciling — not to gate paint.
 * Both fetchers parse the wire shape against the schema SSoT, so the client
 * cache can only ever hold validated models, same as the server loaders.
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
 * Two revalidations, one per cache the write can invalidate:
 * - the bill's own detail entry (`mutate(key)` re-runs the detail hook's
 *   bound fetcher, so the screen re-reads the record it's showing), and
 * - EVERY rail category list, by key-filter: a write that moves a bill's
 *   status moves it BETWEEN groups, so both the group it left and the group
 *   it joined are stale — and which pair that is isn't this helper's
 *   business. Non-mounted categories hold no entries, so the filter touches
 *   exactly what's alive.
 *
 * Takes the caller's scoped `mutate` (from `useSWRConfig()`) rather than being
 * a hook itself, so plain async flows can call it after their POST settles.
 * On surfaces with no SWR entries at all (the Bill Pay table's kebab) both
 * halves are no-ops — the caller's `router.refresh()` still covers RSC data.
 *
 * Never rejects: a failed revalidation just leaves an entry at its current
 * value (the write itself already succeeded), and the focus / reconnect
 * revalidation recovers it — the caller's success path must not turn into an
 * error line over a refresh.
 */
export async function reconcileBillCaches(mutate: ScopedMutator, id: string): Promise<void> {
  await Promise.all([
    mutate(billDetailSwrKey(id)).catch(() => undefined),
    mutate((key) => typeof key === 'string' && key.startsWith(RAIL_BILLS_PREFIX)).catch(
      () => undefined,
    ),
  ]);
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
