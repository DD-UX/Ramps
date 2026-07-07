import { describe, expect, it } from 'vitest';

import type { VendorTab } from '../constants/vendor-tabs.constants';
import { resolveTab, reviewStatesForTab, tabHref } from './vendor-tabs.helpers';

/**
 * The vendor tab bar is a constant (unlike bills' DB catalog), but the helpers
 * still operate on rows, not a hardcoded list — the fixture mirrors the
 * VENDOR_TABS shape (Overview first/unfiltered; the workflow tabs each rolling
 * up their single review-state bucket). The default is the FIRST row by order.
 */
const TABS: VendorTab[] = [
  { code: 'overview', name: 'Overview', reviewStates: [] },
  { code: 'needs-review', name: 'Needs review', reviewStates: ['needs_review'] },
  { code: 'renewals', name: 'Renewals', reviewStates: ['renewal'] },
  { code: 'duplicates', name: 'Duplicates', reviewStates: ['duplicate'] },
  { code: 'switch-cards', name: 'Switch cards', reviewStates: ['switch_card'] },
];

describe('resolveTab', () => {
  it('resolves a real tab code to its row', () => {
    expect(resolveTab(TABS, 'needs-review').code).toBe('needs-review');
    expect(resolveTab(TABS, 'duplicates').code).toBe('duplicates');
  });

  it('falls back to the first tab for missing / unknown / stale codes', () => {
    expect(resolveTab(TABS, undefined).code).toBe('overview');
    expect(resolveTab(TABS, '').code).toBe('overview');
    expect(resolveTab(TABS, 'garbage').code).toBe('overview');
    expect(resolveTab(TABS, 'Needs-Review').code).toBe('overview'); // case-sensitive
  });

  it('honors the catalog order — the first row is the default, whatever it is', () => {
    const reordered: VendorTab[] = [...TABS].reverse(); // Switch cards first
    expect(resolveTab(reordered, undefined).code).toBe('switch-cards');
    expect(resolveTab(reordered, 'nope').code).toBe('switch-cards');
  });

  it('throws on an empty catalog (a broken build, not a user path)', () => {
    expect(() => resolveTab([], undefined)).toThrow();
  });
});

describe('reviewStatesForTab', () => {
  const byCode = (code: string) => resolveTab(TABS, code);

  it('returns an empty group for the default tab (unfiltered)', () => {
    expect(reviewStatesForTab(byCode('overview'))).toEqual([]);
  });

  it('maps each workflow tab to its single review-state bucket', () => {
    expect(reviewStatesForTab(byCode('needs-review'))).toEqual(['needs_review']);
    expect(reviewStatesForTab(byCode('renewals'))).toEqual(['renewal']);
    expect(reviewStatesForTab(byCode('duplicates'))).toEqual(['duplicate']);
    expect(reviewStatesForTab(byCode('switch-cards'))).toEqual(['switch_card']);
  });
});

describe('tabHref', () => {
  it('drops the param when selecting the default (first) tab', () => {
    expect(tabHref('/vendors', 'overview', 'overview')).toBe('/vendors');
  });

  it('writes ?tab=<code> for a non-default tab', () => {
    expect(tabHref('/vendors', 'needs-review', 'overview')).toBe('/vendors?tab=needs-review');
    expect(tabHref('/vendors', 'duplicates', 'overview')).toBe('/vendors?tab=duplicates');
  });

  it('never drops the param when there is no default (empty catalog)', () => {
    expect(tabHref('/vendors', 'renewals', undefined)).toBe('/vendors?tab=renewals');
  });
});
