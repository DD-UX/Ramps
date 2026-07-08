import type { BillStatusType } from '@ramps/schemas/bills';

/**
 * When is a bill's approval ROUTE editable?
 *
 * Only while the bill is pre-submit — a `draft` or `missing_info` bill (the
 * snapshot-10 "Create bill" author view). Once it moves to `awaiting_approval`
 * and beyond, the chain is a frozen record of the route, so the
 * ApprovalsWorkflow renders `readOnly`. This single set backs BOTH the
 * component's `readOnly` and the PUT route's guard, so the client and server
 * agree on the lock.
 */
export const APPROVAL_ROUTE_EDITABLE_STATUSES: readonly BillStatusType[] = [
  'draft',
  'missing_info',
];

/** True when the bill's status still permits editing its approval route. */
export function isApprovalRouteEditable(status: BillStatusType): boolean {
  return APPROVAL_ROUTE_EDITABLE_STATUSES.includes(status);
}
