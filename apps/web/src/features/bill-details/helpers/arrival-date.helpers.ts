/**
 * Payment-schedule date math for the Payment section (snapshot 9): the video
 * shows a `Payment date` → `Arrival date` pair ("2 business days") and an
 * overdue banner ("This bill is 37 days overdue"). These pure helpers back both.
 *
 * All dates are the app's bare `YYYY-MM-DD` ISO strings; we parse them at UTC
 * noon so day arithmetic never trips the negative-timezone off-by-one.
 */

/** ACH lands in ~2 business days; the picker's default settlement window. */
export const DEFAULT_SETTLEMENT_BUSINESS_DAYS = 2;

/** Parse a bare ISO date at UTC noon, or null if malformed/absent. */
function parseIsoNoon(iso: string | null): Date | null {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Serialize a Date back to the app's `YYYY-MM-DD` (UTC). */
function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Sat/Sun in UTC — the days ACH doesn't settle. */
function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Add N business days to an ISO payment date → the ISO arrival date. Weekends
 * are skipped (holidays are out of scope for the demo). Returns null when the
 * input date is absent/malformed so the UI can show a dash.
 */
export function addBusinessDays(
  iso: string | null,
  days: number = DEFAULT_SETTLEMENT_BUSINESS_DAYS,
): string | null {
  const date = parseIsoNoon(iso);
  if (!date) return null;

  let remaining = Math.max(0, Math.trunc(days));
  const cursor = new Date(date);
  while (remaining > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (!isWeekend(cursor)) remaining -= 1;
  }
  return toIsoDate(cursor);
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
