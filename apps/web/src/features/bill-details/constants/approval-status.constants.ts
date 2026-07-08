import type { BillApprovalStepType } from '@ramps/schemas/bills';
import type { BadgeProps } from '@ramps/ui/Badge';

/**
 * How each approval step's status renders in the approver chain (snapshot 10).
 * `Pending` stays quiet neutral, `Approved` positive-green, `Rejected` the
 * critical family — the same tone language the rest of Bill Pay uses.
 */
export const APPROVAL_STATUS_BADGE: Record<
  BillApprovalStepType['status'],
  { label: string; tone: NonNullable<BadgeProps['tone']> }
> = {
  pending: { label: 'Pending', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'positive' },
  rejected: { label: 'Rejected', tone: 'critical' },
};
