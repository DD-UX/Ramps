import { describe, expect, it } from 'vitest';

import { BILL_STATUS_TABS, parseStatusParam } from './status-tabs.constants';

/**
 * parseStatusParam hardens the `?status=` query param before it becomes a DB
 * filter. Anything that isn't a real lifecycle state must fall back to the
 * unfiltered list so a hand-typed URL can never 500 or inject.
 */
describe('parseStatusParam', () => {
  it('passes a real lifecycle state through', () => {
    expect(parseStatusParam('paid')).toBe('paid');
    expect(parseStatusParam('awaiting_approval')).toBe('awaiting_approval');
  });

  it("treats the 'all' tab as unfiltered (undefined)", () => {
    expect(parseStatusParam('all')).toBeUndefined();
  });

  it('treats a missing param as unfiltered', () => {
    expect(parseStatusParam(undefined)).toBeUndefined();
  });

  it('rejects an unknown value as unfiltered', () => {
    expect(parseStatusParam('garbage')).toBeUndefined();
    expect(parseStatusParam('')).toBeUndefined();
    expect(parseStatusParam('DRAFT')).toBeUndefined(); // case-sensitive
  });

  it('accepts every non-all tab value it advertises', () => {
    for (const tab of BILL_STATUS_TABS) {
      if (tab.value === 'all') continue;
      expect(parseStatusParam(tab.value)).toBe(tab.value);
    }
  });
});
