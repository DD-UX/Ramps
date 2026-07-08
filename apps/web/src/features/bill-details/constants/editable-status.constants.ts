import type { BillStatusType } from '@ramps/schemas/bills';

/**
 * When can a bill's record be edited AT ALL?
 *
 * Wider than the PRE-SUBMIT window (`draft`/`missing_info`, see
 * `pre-submit.constants`): a bill in `awaiting_approval` is still being shaped
 * while it sits in the queue, so its header + line items stay editable. From
 * `approved` onward the bill enters the payment pipeline (or a terminal state)
 * and its record is frozen — `approved`, `scheduled`, `partially_paid`, `paid`,
 * `rejected`, `archived` — so the screen offers no way back into edit mode.
 *
 * This is the CLIENT mirror of the SDK's `BILL_EDITABLE_STATUSES` (the
 * `saveBill` guard). The two lists must stay identical: the client hides the
 * "Edit bill" affordance exactly where the server would 409 a save. Kept as a
 * standalone constant (not imported from the SDK) so a client component never
 * pulls the SDK's server client into the bundle.
 */
export const EDITABLE_BILL_STATUSES: readonly BillStatusType[] = [
  'draft',
  'missing_info',
  'awaiting_approval',
];

/** True while the bill's record still accepts edits (pre-submit OR awaiting approval). */
export function isBillEditable(status: BillStatusType): boolean {
  return EDITABLE_BILL_STATUSES.includes(status);
}
