import type { BillStatusType } from '@ramps/schemas/bills';

import { PRE_SUBMIT_BILL_STATUSES } from './pre-submit.constants';

/**
 * When is a bill's approval ROUTE editable?
 *
 * Only while the bill is pre-submit — a `draft` or `missing_info` bill (the
 * snapshot-10 "Create bill" author view). Once it moves to `awaiting_approval`
 * and beyond, the chain is a frozen record of the route, so the
 * ApprovalsWorkflow renders `readOnly`. This single set backs BOTH the
 * component's `readOnly` and the PUT route's guard, so the client and server
 * agree on the lock. The set itself is the shared pre-submit window — see
 * `pre-submit.constants` — this alias keeps the approval-route intent named.
 */
export const APPROVAL_ROUTE_EDITABLE_STATUSES: readonly BillStatusType[] =
  PRE_SUBMIT_BILL_STATUSES;

/** True when the bill's status still permits editing its approval route. */
export function isApprovalRouteEditable(status: BillStatusType): boolean {
  return APPROVAL_ROUTE_EDITABLE_STATUSES.includes(status);
}
