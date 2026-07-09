import { type BillStatusType, canTransitionBill } from '@ramps/schemas/bills';

/**
 * The overflow ("three-dot") menu's lifecycle actions — the ones the bills
 * table row and the bill-details footer share. Two moves, each a pure status
 * advance:
 *
 * - `archive` — file the bill out of the working set. Legal from every state
 *   the transition map routes to `archived` — every LIVE status except the two
 *   with a payment already in flight (`scheduled`, `partially_paid`, which move
 *   only onward through the payment lifecycle) and `archived` itself. So it's the
 *   near-universal fallback the menu usually has, but not while money is moving.
 * - `reject` — the reviewer's "send it back". Legal ONLY from
 *   `awaiting_approval`, the single state the map routes to `rejected` — a bill
 *   still up for review can be rejected; anything past the queue cannot.
 *
 * Availability is derived from `canTransitionBill`, not a second hardcoded list,
 * so this can't drift from the SDK guard that actually performs the move.
 */
export const BILL_ACTION = {
  ARCHIVE: 'archive',
  REJECT: 'reject',
} as const;

export type BillAction = (typeof BILL_ACTION)[keyof typeof BILL_ACTION];

/** The menu-item label shown for each action. */
export const BILL_ACTION_LABEL: Record<BillAction, string> = {
  [BILL_ACTION.ARCHIVE]: 'Archive',
  [BILL_ACTION.REJECT]: 'Reject',
};

/**
 * The actions available for a bill in the given status, in menu order (Reject
 * above Archive — the reviewer's decision first, the always-there filing move
 * last). Both edges are checked against the transition map, so an empty result
 * means the bill has no overflow action at all — and the menu renders NOTHING
 * (no trigger, no empty column cell), so only actionable rows carry the kebab.
 */
export function resolveBillActions(status: BillStatusType): BillAction[] {
  const actions: BillAction[] = [];
  if (canTransitionBill(status, 'rejected')) actions.push(BILL_ACTION.REJECT);
  if (canTransitionBill(status, 'archived')) actions.push(BILL_ACTION.ARCHIVE);
  return actions;
}

/**
 * Does this status carry ANY overflow action? The call sites use this to decide
 * whether to mount the menu at all — a `rejected`, `archived`, `scheduled` or
 * `partially_paid` bill has no move, so its row shows a blank cell (and the
 * footer omits the kebab) rather than an inert, unclickable three-dot.
 */
export function hasBillActions(status: BillStatusType): boolean {
  return resolveBillActions(status).length > 0;
}
