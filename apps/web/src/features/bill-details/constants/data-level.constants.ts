/**
 * The detail screen's rendering ladder — how much of the open bill the client
 * actually holds, in strictly increasing order:
 *
 * - `skeleton` — nothing yet (a cold deep link's first moments): every
 *   section renders its own skeleton, inside the REAL layout chrome.
 * - `seed` — the rail list item: header-level concerns (vendor, invoice
 *   info, PO, memo, title) paint real values; detail-only concerns (line
 *   items, payment, approvals, document) stay skeletons; editing is locked.
 * - `full` — the fetched record: everything real, editing per status.
 *
 * One ladder, one vocabulary: sections decide "am I real yet?" by comparing
 * against the level they need, never by inventing their own loading flags.
 */
export const BILL_DETAIL_DATA_LEVEL = {
  SKELETON: 'skeleton',
  SEED: 'seed',
  FULL: 'full',
} as const;

export type BillDetailDataLevel =
  (typeof BILL_DETAIL_DATA_LEVEL)[keyof typeof BILL_DETAIL_DATA_LEVEL];

/** The ladder's ordering — higher holds strictly more of the bill. */
const DATA_LEVEL_RANK: Record<BillDetailDataLevel, number> = {
  [BILL_DETAIL_DATA_LEVEL.SKELETON]: 0,
  [BILL_DETAIL_DATA_LEVEL.SEED]: 1,
  [BILL_DETAIL_DATA_LEVEL.FULL]: 2,
};

/**
 * Did the ladder climb between two commits? The provider's upgrade effect
 * re-derives form/edit/payment state exactly when this is true — a climb means
 * the `bill` prop was REPLACED by a strictly richer record, so the seeded
 * state is stale by construction and nothing user-typed can exist yet.
 */
export function dataLevelRose(prev: BillDetailDataLevel, next: BillDetailDataLevel): boolean {
  return DATA_LEVEL_RANK[next] > DATA_LEVEL_RANK[prev];
}

/**
 * "Is my data real yet?" — the one question every section asks, against the
 * level ITS concern needs: header concerns need `seed` (a rail item carries
 * them), detail-only concerns need `full`. Below the needed level a section
 * renders its own skeleton; at or above it, the truth.
 */
export function dataLevelAtLeast(
  current: BillDetailDataLevel,
  needed: BillDetailDataLevel,
): boolean {
  return DATA_LEVEL_RANK[current] >= DATA_LEVEL_RANK[needed];
}
