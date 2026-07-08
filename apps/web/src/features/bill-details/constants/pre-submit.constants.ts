import type { BillStatusType } from '@ramps/schemas/bills';

/**
 * The bill's PRE-SUBMIT window: `draft` and `missing_info` — the author view,
 * before the bill enters the approval pipeline.
 *
 * This one set drives every "is this bill still being authored?" decision:
 * the approval route's edit lock (see `approval-editable.constants`), and the
 * footer's action pair — pre-submit bills carry "Save draft", anything past
 * that opens READ-ONLY and offers "Edit bill" instead (the context's
 * `editable` toggle). One list, so the statuses can never drift apart between
 * those consumers.
 */
export const PRE_SUBMIT_BILL_STATUSES: readonly BillStatusType[] = ['draft', 'missing_info'];

/** True while the bill is still being authored (`draft` / `missing_info`). */
export function isBillPreSubmit(status: BillStatusType): boolean {
  return PRE_SUBMIT_BILL_STATUSES.includes(status);
}
