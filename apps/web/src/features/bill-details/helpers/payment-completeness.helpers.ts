import type { BillDetailType, SchedulePaymentType } from '@ramps/schemas/bills';

/**
 * The client-side payment slice the Payment section edits and the schedule
 * modal shares — pay-from account + the "now / later" schedule choice and its
 * date. It's NOT part of the bill's edit form (the bill is the obligation; a
 * payment is a separate money movement), so it lives in the detail context as
 * its own state rather than in react-hook-form.
 *
 * `method` is ACH-only in this demo, so it's fixed rather than picked; it stays
 * on the slice so "complete payment details" reads as one whole thing.
 */
export interface PaymentDraft {
  /** The only rail the demo offers; always `'ach'`. */
  method: 'ach';
  /** Pay-from bank account id, or `''` until the user picks one. */
  accountId: string;
  /** Pay now (arrival = today + 2 business days) vs. pick a later date. */
  schedule: 'now' | 'later';
  /** The chosen ISO pay date when `schedule === 'later'`; `''` otherwise. */
  payDate: string;
}

/** The Payment section's starting state: ACH, no account, schedule now. */
export const EMPTY_PAYMENT_DRAFT: PaymentDraft = {
  method: 'ach',
  accountId: '',
  schedule: 'now',
  payDate: '',
};

/**
 * Seed the slice from a bill: hydrate from its persisted payment when it has
 * one (a `scheduled` bill — its account + date drive "View schedule"),
 * otherwise start blank. A payment's `scheduled_date` is always a concrete
 * date, so we surface it as an explicit "later" pick — the modal shows the
 * booked date rather than snapping to today.
 */
export function paymentDraftFor(bill: BillDetailType): PaymentDraft {
  const payment = bill.payment;
  if (!payment) return EMPTY_PAYMENT_DRAFT;
  return {
    method: 'ach',
    accountId: payment.account_id ?? '',
    schedule: 'later',
    payDate: payment.scheduled_date,
  };
}

/** Today as an ISO `yyyy-mm-dd` date string (the "Schedule now" baseline). */
export function todayIso(today: Date = new Date()): string {
  return today.toISOString().slice(0, 10);
}

/**
 * Resolve the slice's scheduled date to a concrete ISO date, or null when it
 * can't be pinned down yet. "Schedule now" is always today; "Schedule later"
 * is the chosen date, or null while the picker is empty.
 */
export function resolveScheduledDate(draft: PaymentDraft, today: Date = new Date()): string | null {
  if (draft.schedule === 'later') return draft.payDate || null;
  return todayIso(today);
}

/**
 * Are the payment details COMPLETE enough to schedule? Per the product rule:
 * a pay-from account AND a resolved schedule date (method is the fixed ACH
 * rail). This gates Approve's "→ scheduled" branch and the modal's Save — you
 * can't schedule a payment without a source of payment.
 */
export function isPaymentComplete(draft: PaymentDraft, today: Date = new Date()): boolean {
  return draft.accountId.length > 0 && resolveScheduledDate(draft, today) !== null;
}

/**
 * Project the slice to the SCHEDULE wire payload, or null when it isn't
 * complete. The server owns the rail (ACH) and the amount (the bill's), so the
 * payload is just the account + the resolved date — the shape both the Approve
 * body's `schedule` and the Schedule-payment body take.
 */
export function toSchedulePayload(
  draft: PaymentDraft,
  today: Date = new Date(),
): SchedulePaymentType | null {
  const scheduledDate = resolveScheduledDate(draft, today);
  if (draft.accountId.length === 0 || scheduledDate === null) return null;
  return { account_id: draft.accountId, scheduled_date: scheduledDate };
}
