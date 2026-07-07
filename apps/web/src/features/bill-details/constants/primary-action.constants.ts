import type { BillStatusType } from '@ramps/schemas/bills';

/**
 * The primary CTA label per bill status — the status-specific action the footer
 * offers (snapshot 9 shows "Create bill" on a draft). A draft is created, a
 * complete bill is submitted for approval, an approved one is scheduled, and a
 * settled bill has nothing left to do. One map so the footer stays declarative.
 */
export const PRIMARY_ACTION_BY_STATUS: Record<BillStatusType, string> = {
  draft: 'Create bill',
  missing_info: 'Create bill',
  awaiting_approval: 'Approve',
  approved: 'Schedule payment',
  scheduled: 'View schedule',
  partially_paid: 'Complete payment',
  paid: 'View payment',
  rejected: 'Reopen bill',
  archived: 'Restore bill',
};
