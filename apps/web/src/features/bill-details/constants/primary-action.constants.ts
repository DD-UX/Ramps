import type { BillStatusType } from '@ramps/schemas/bills';
import {
  CalendarClock,
  Check,
  CircleDollarSign,
  Eye,
  FilePlus,
  type LucideIcon,
} from '@ramps/ui/icons';

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
  // `rejected` + `archived` render NO primary (see `hasPrimaryAction`) — there's
  // no reopen/restore flow, so the footer omits the button rather than showing an
  // inert one. The entries stay only to satisfy the exhaustive record; they're
  // never displayed.
  rejected: '',
  archived: '',
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
 * - `complete` — `partially_paid`: roll the booked payment NOW (→ `paid`). The
 *   footer renders the shared Complete-payment button AS the primary here, so
 *   the money-movement flow is wired identically to the `scheduled` companion.
 * - `none` — everything else (terminal / out-of-scope states): the button is
 *   inert this pass, so the footer disables it rather than firing a wrong write.
 */
export const PRIMARY_ACTION = {
  CREATE: 'create',
  APPROVE: 'approve',
  SCHEDULE: 'schedule',
  VIEW: 'view',
  COMPLETE: 'complete',
  NONE: 'none',
} as const;

export type PrimaryAction = (typeof PRIMARY_ACTION)[keyof typeof PRIMARY_ACTION];

const PRIMARY_ACTION_BY_STATUS_KIND: Record<BillStatusType, PrimaryAction> = {
  draft: PRIMARY_ACTION.CREATE,
  missing_info: PRIMARY_ACTION.CREATE,
  awaiting_approval: PRIMARY_ACTION.APPROVE,
  approved: PRIMARY_ACTION.SCHEDULE,
  scheduled: PRIMARY_ACTION.VIEW,
  // A part-settled bill's primary IS the working "Complete payment" — roll the
  // booked payment now to finish it (`partially_paid → paid`).
  partially_paid: PRIMARY_ACTION.COMPLETE,
  // Terminal / not-yet-wired states — the label still reads (e.g. "View
  // payment"), but there's no flow behind it this pass, so it's inert.
  paid: PRIMARY_ACTION.NONE,
  rejected: PRIMARY_ACTION.NONE,
  archived: PRIMARY_ACTION.NONE,
};

/** The behaviour kind of the footer's primary CTA for the given bill status. */
export function resolvePrimaryAction(status: BillStatusType): PrimaryAction {
  return PRIMARY_ACTION_BY_STATUS_KIND[status];
}

/**
 * Statuses whose footer renders NO primary at all — the slot stays empty rather
 * than showing an inert CTA. `rejected` + `archived` are the cases: no reopen /
 * restore flow is offered, so the footer omits the button entirely (no "Reopen
 * bill" / "Restore bill" UI) instead of rendering it disabled.
 */
const STATUSES_WITHOUT_PRIMARY: ReadonlySet<BillStatusType> = new Set(['rejected', 'archived']);

/** Whether the footer should render a primary button at all for this status. */
export function hasPrimaryAction(status: BillStatusType): boolean {
  return !STATUSES_WITHOUT_PRIMARY.has(status);
}

/**
 * The primary CTA's leading glyph per STATUS — one icon for every footer
 * primary that renders, mirroring the label above:
 *   • FilePlus       — Create bill (a new bill filed)         [draft/missing_info]
 *   • Check          — Approve (the reviewer's tick)          [awaiting_approval]
 *   • CalendarClock  — Schedule payment (a date being set)    [approved]
 *   • Eye            — View schedule / View payment (read-only)[scheduled/paid]
 *   • CircleDollarSign — Complete payment (money moving)       [partially_paid]
 *
 * `rejected` + `archived` have NO primary (see `hasPrimaryAction`) so they need
 * no glyph; their entries map to a neutral placeholder purely to keep the record
 * exhaustive — the footer never renders a button for them, so it's never shown.
 */
const PRIMARY_ACTION_ICON_BY_STATUS: Record<BillStatusType, LucideIcon> = {
  draft: FilePlus,
  missing_info: FilePlus,
  awaiting_approval: Check,
  approved: CalendarClock,
  scheduled: Eye,
  partially_paid: CircleDollarSign,
  paid: Eye,
  rejected: Eye, // unused — rejected renders no primary
  archived: Eye, // unused — archived renders no primary
};

/** The leading icon for the footer primary of the given bill status. */
export function resolvePrimaryActionIcon(status: BillStatusType): LucideIcon {
  return PRIMARY_ACTION_ICON_BY_STATUS[status];
}
