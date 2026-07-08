/**
 * Server-side payment-arrival date math. The `payments` row carries an
 * `arrival_date` — when the money LANDS, not when it leaves — derived from the
 * scheduled date as "2 business days" for the ACH rail (§6). The web app has a
 * client twin of this for the live read-out; the server owns its OWN copy so
 * the persisted `arrival_date` never depends on whatever the browser sent.
 *
 * Dates are the app's bare `YYYY-MM-DD` ISO strings, parsed at UTC noon so day
 * arithmetic never trips the negative-timezone off-by-one.
 */

/** ACH lands in ~2 business days; the rail's default settlement window. */
export const DEFAULT_SETTLEMENT_BUSINESS_DAYS = 2;

/** Sat/Sun in UTC — the days ACH doesn't settle. */
function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Add N business days to an ISO scheduled date → the ISO arrival date. Weekends
 * are skipped (holidays are out of scope). Returns null when the input date is
 * absent/malformed.
 */
export function addBusinessDays(
  iso: string | null,
  days: number = DEFAULT_SETTLEMENT_BUSINESS_DAYS,
): string | null {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  let remaining = Math.max(0, Math.trunc(days));
  const cursor = new Date(date);
  while (remaining > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (!isWeekend(cursor)) remaining -= 1;
  }
  return cursor.toISOString().slice(0, 10);
}
