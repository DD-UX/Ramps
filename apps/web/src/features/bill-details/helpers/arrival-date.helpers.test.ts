import { describe, expect, it } from 'vitest';

import { addBusinessDays, daysOverdue, isOverdue } from './arrival-date.helpers';

/**
 * The Payment section derives an arrival date from a payment date ("2 business
 * days") and an overdue banner from the due date. These lock the day math,
 * including the weekend skip and the negative-timezone-safe parsing.
 */
describe('addBusinessDays', () => {
  it('adds two business days across a mid-week date', () => {
    // Wed 2026-07-01 + 2 business days = Fri 2026-07-03
    expect(addBusinessDays('2026-07-01', 2)).toBe('2026-07-03');
  });

  it('skips the weekend', () => {
    // Fri 2026-07-03 + 2 business days = Tue 2026-07-07 (Sat/Sun skipped)
    expect(addBusinessDays('2026-07-03', 2)).toBe('2026-07-07');
  });

  it('defaults to the ACH 2-day window', () => {
    expect(addBusinessDays('2026-07-01')).toBe('2026-07-03');
  });

  it('returns the same date for zero days', () => {
    expect(addBusinessDays('2026-07-01', 0)).toBe('2026-07-01');
  });

  it('returns null for an absent or malformed date', () => {
    expect(addBusinessDays(null)).toBeNull();
    expect(addBusinessDays('not-a-date')).toBeNull();
  });
});

describe('daysOverdue', () => {
  const today = new Date('2026-07-06T09:00:00Z');

  it('counts whole days past the due date', () => {
    expect(daysOverdue('2026-07-01', today)).toBe(5);
  });

  it('is zero on the due date and in the future', () => {
    expect(daysOverdue('2026-07-06', today)).toBe(0);
    expect(daysOverdue('2026-07-20', today)).toBe(0);
  });

  it('never returns a negative for a not-yet-due bill', () => {
    expect(daysOverdue('2026-08-01', today)).toBe(0);
  });

  it('is zero for an absent due date', () => {
    expect(daysOverdue(null, today)).toBe(0);
  });
});

describe('isOverdue', () => {
  const today = new Date('2026-07-06T09:00:00Z');

  it('is true only when past due', () => {
    expect(isOverdue('2026-07-01', today)).toBe(true);
    expect(isOverdue('2026-07-06', today)).toBe(false);
    expect(isOverdue('2026-07-20', today)).toBe(false);
    expect(isOverdue(null, today)).toBe(false);
  });
});
