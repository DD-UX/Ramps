'use client';

import type { BillDetailResponseType } from '@ramps/schemas/bills';
import { notFound } from 'next/navigation';
import { useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import {
  BILL_DETAIL_DATA_LEVEL,
  type BillDetailDataLevel,
} from '../constants/data-level.constants';
import { useBillRail } from '../context/BillRail.context';
import { billDetailSwrKey, fetchBillDetail } from '../helpers/bill-cache.helpers';
import { billDetailFromSeed, billDetailPlaceholder } from '../helpers/bill-seed.helpers';
import { BillDetailsContent } from './BillDetailsContent';

export interface BillDetailsScreenProps {
  /** The route's `[id]` — which bill this screen is showing. */
  id: string;
  /**
   * The RSC page's STREAMED read of this bill — started server-side without
   * being awaited, so the page's shell reaches the client before the data
   * does. Resolves to the same envelope `GET /api/bills/:id` answers with, or
   * null for "no such bill" (the one not-found signal both paths share).
   */
  seed: Promise<BillDetailResponseType | null>;
}

/**
 * BillDetailsScreen — the client half of `/bills/[id]`: it decides how much
 * of the bill the client holds RIGHT NOW and mounts the one real surface at
 * that data level. The ladder (see {@link BILL_DETAIL_DATA_LEVEL}):
 *
 *  1. `full` — the detail cache entry (streamed by this page, confirmed or
 *     freshened by `GET /api/bills/:id`). Everything real.
 *  2. `seed` — the rail already holds this bill's list item (every rail hop):
 *     header concerns paint real values instantly, detail-only sections
 *     skeleton, editing locked until the full record lands.
 *  3. `skeleton` — a cold deep link's first moments: a placeholder record
 *     mounts the real chrome and every section skeletons itself.
 *
 * The streamed read is piped into the SWR entry (`mutate` with `revalidate:
 * false` — the server's answer IS fresh) rather than awaited in render, so
 * NAVIGATION NEVER BLOCKS ON FETCH: the ladder upgrades in place when the
 * promise settles. `revalidateOnMount` is off for the same reason — every
 * navigation already streams a fresh seed; the fetcher exists for focus /
 * reconnect / mutation reconciliation. `keepPreviousData` is off deliberately,
 * overriding the global config: on a bill → bill hop the previous RECORD must
 * not impersonate the next one — the seed tier is the honest in-between.
 *
 * `key={id}` on the content is LOAD-BEARING: rail hops are client-side, and
 * an unkeyed provider would carry the previous bill's form state (values,
 * dirtiness, staged approvals) into the next record. Keyed, every bill mounts
 * a fresh editing surface; the ladder's upgrades within ONE bill keep the
 * same key, so scroll, split and tab choice survive them.
 *
 * A resolved `null` (either path) throws `notFound()` — one signal, one
 * screen, regardless of which side answered.
 */
export function BillDetailsScreen({ id, seed }: BillDetailsScreenProps) {
  const { refs, seedFor } = useBillRail();
  const { mutate } = useSWRConfig();

  // Pipe the streamed read into the cache. Effect, not render: mutate writes
  // a shared store. `Promise.resolve(seed)` is LOAD-BEARING, not ceremony:
  // the RSC boundary hands the client a bare THENABLE — its `.then` fires
  // callbacks but returns undefined, so it doesn't chain — and SWR's mutate
  // internally does `await data.catch(…)`, which on the raw thenable yields
  // undefined and caches NOTHING (the ladder then never climbs).
  // `Promise.resolve` assimilates it into a real, chainable promise. A
  // rejection (a dropped connection mid-stream) is swallowed — the entry just
  // stays at its current rung and the focus / reconnect revalidation recovers
  // it.
  useEffect(() => {
    void mutate(billDetailSwrKey(id), Promise.resolve(seed), { revalidate: false }).catch(
      () => undefined,
    );
  }, [id, seed, mutate]);

  const { data: detail } = useSWR(billDetailSwrKey(id), () => fetchBillDetail(id), {
    revalidateOnMount: false,
    keepPreviousData: false,
  });

  // Both the streamed seed and the API fetcher resolve null for "no such
  // bill" — the single not-found signal.
  if (detail === null) notFound();

  const railSeed = detail == null ? seedFor(id) : null;
  const dataLevel: BillDetailDataLevel = detail
    ? BILL_DETAIL_DATA_LEVEL.FULL
    : railSeed
      ? BILL_DETAIL_DATA_LEVEL.SEED
      : BILL_DETAIL_DATA_LEVEL.SKELETON;
  const bill =
    detail?.bill ?? (railSeed ? billDetailFromSeed(railSeed) : billDetailPlaceholder(id));

  return (
    <BillDetailsContent
      key={id}
      bill={bill}
      refs={refs}
      documentUrl={detail?.documentUrl ?? null}
      dataLevel={dataLevel}
    />
  );
}
