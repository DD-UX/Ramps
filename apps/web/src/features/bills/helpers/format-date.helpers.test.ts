import { describe, expect, it } from 'vitest';

import { formatBillDate } from './format-date.helpers';

/**
 * formatBillDate renders the table's invoice/due dates. It must dodge the
 * bare-`YYYY-MM-DD`-as-UTC-midnight off-by-one and show an em dash for the
 * null dates on email-ingested drafts.
 */
describe('formatBillDate', () => {
  it('formats an ISO date as short "Mon D, YYYY"', () => {
    expect(formatBillDate('2025-02-01')).toBe('Feb 1, 2025');
    expect(formatBillDate('2025-12-25')).toBe('Dec 25, 2025');
  });

  it('does not drift a day across the UTC-midnight boundary', () => {
    // Parsed at noon UTC, so it stays Jan 1 regardless of a negative TZ offset.
    expect(formatBillDate('2025-01-01')).toBe('Jan 1, 2025');
  });

  it('renders an em dash for a null date', () => {
    expect(formatBillDate(null)).toBe('—');
  });

  it('renders an em dash for an unparseable string', () => {
    expect(formatBillDate('not-a-date')).toBe('—');
  });
});
