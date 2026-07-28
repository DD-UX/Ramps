/**
 * Payment-schedule date math for the Payment section (snapshot 9): the video
 * shows a `Payment date` → `Arrival date` pair ("2 business days") and an
 * overdue banner ("This bill is 37 days overdue").
 *
 * The arrival half — business-day addition and the ACH settlement window — is
 * `@ramps/sdk/arrival`, re-exported so the live read-out runs the SAME pure
 * math `schedulePayment` persists (the server still computes the stored
 * `arrival_date` itself; the browser never sends one). Only the overdue math
 * lives here: it's a display concern with a "today" in it, which no persisted
 * row ever needs.
 *
 * All dates are the app's bare `YYYY-MM-DD` ISO strings; we parse them at UTC
 * noon so day arithmetic never trips the negative-timezone off-by-one.
 */

export { addBusinessDays, DEFAULT_SETTLEMENT_BUSINESS_DAYS } from '@ramps/sdk/arrival';

/** Parse a bare ISO date at UTC noon, or null if malformed/absent. */
function parseIsoNoon(iso: string | null): Date | null {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Whole days a bill is overdue as of `today` (default: now). Zero when the due
 * date is today, in the future, or absent. Positive only — the banner reads
 * "N days overdue", so a not-yet-due bill returns 0, never a negative.
 */
export function daysOverdue(dueIso: string | null, today: Date = new Date()): number {
  const due = parseIsoNoon(dueIso);
  if (!due) return 0;

  const ref = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12),
  );
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor((ref.getTime() - due.getTime()) / msPerDay);
  return diff > 0 ? diff : 0;
}

/** Is the bill past due as of `today`? Thin predicate over {@link daysOverdue}. */
export function isOverdue(dueIso: string | null, today: Date = new Date()): boolean {
  return daysOverdue(dueIso, today) > 0;
}
