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

/**
 * The primary CTA's BEHAVIOUR kind per status — the label above says WHAT the
 * button reads; this says what pressing it DOES, so the footer branches on a
 * declarative kind instead of re-deriving intent from the status inline.
 *
 * - `create` — pre-submit (`draft`/`missing_info`): save + submit for approval.
 * - `approve` — `awaiting_approval`: persist the form and advance the bill;
 *   if the shared payment slice is complete the server schedules, else approves.
 * - `schedule` — `approved`: open the schedule-payment modal (book the payment).
 * - `view` — `scheduled`: open the same modal read-only ("View schedule").
 * - `none` — everything else (terminal / out-of-scope states): the button is
 *   inert this pass, so the footer disables it rather than firing a wrong write.
 */
export const PRIMARY_ACTION = {
  CREATE: 'create',
  APPROVE: 'approve',
  SCHEDULE: 'schedule',
  VIEW: 'view',
  NONE: 'none',
} as const;

export type PrimaryAction = (typeof PRIMARY_ACTION)[keyof typeof PRIMARY_ACTION];

const PRIMARY_ACTION_BY_STATUS_KIND: Record<BillStatusType, PrimaryAction> = {
  draft: PRIMARY_ACTION.CREATE,
  missing_info: PRIMARY_ACTION.CREATE,
  awaiting_approval: PRIMARY_ACTION.APPROVE,
  approved: PRIMARY_ACTION.SCHEDULE,
  scheduled: PRIMARY_ACTION.VIEW,
  // Terminal / not-yet-wired states — the label still reads (e.g. "View
  // payment"), but there's no flow behind it this pass, so it's inert.
  partially_paid: PRIMARY_ACTION.NONE,
  paid: PRIMARY_ACTION.NONE,
  rejected: PRIMARY_ACTION.NONE,
  archived: PRIMARY_ACTION.NONE,
};

/** The behaviour kind of the footer's primary CTA for the given bill status. */
export function resolvePrimaryAction(status: BillStatusType): PrimaryAction {
  return PRIMARY_ACTION_BY_STATUS_KIND[status];
}
