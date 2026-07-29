import type { BillListItemType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import type { NavSection } from '@/features/common/helpers/nav.helpers';

import { PALETTE_MIN_QUERY_LENGTH } from '../constants/palette.constants';
import {
  billResultDescription,
  billResultLabel,
  isSearchableQuery,
  matchNavItems,
  navigableItems,
  paletteBillsSwrKey,
} from './palette-results.helpers';

/**
 * The palette's pure result logic. What's worth pinning here is the set of
 * promises the overlay can't keep on its own:
 *
 * - the SWR key is its OWN namespace, so a six-row palette read can never be
 *   served from (or serve) the ten-row table's cache entry;
 * - the search gate is one function, so "not searching yet" and "found
 *   nothing" can't disagree between the key and the empty-state copy;
 * - unbuilt destinations are never offered — the palette must not rebuild the
 *   "sidebar full of dead links" problem it exists to make up for;
 * - a bill row degrades to a label rather than an em dash when a field is
 *   missing.
 */
const icon = () => null;

const SECTIONS: NavSection[] = [
  [
    { label: 'Home', href: '/', icon, disabled: true },
    { label: 'Insights', href: '/insights', icon, disabled: true },
  ],
  [
    { label: 'Bill Pay', href: '/bills', icon },
    { label: 'Vendors', href: '/vendors', icon },
  ],
];

function bill(overrides: Partial<BillListItemType>): BillListItemType {
  return {
    vendor_name: 'Acme Supply',
    invoice_number: 'INV-2042',
    due_date: '2026-03-03',
    ...overrides,
  } as BillListItemType;
}

describe('paletteBillsSwrKey', () => {
  it('namespaces palette reads away from the table windows', () => {
    expect(paletteBillsSwrKey('acme')).toBe('PALETTE_BILLS:q=acme');
    expect(paletteBillsSwrKey('acme')).not.toContain('BILLS_LIST');
  });

  it('gives different terms different keys', () => {
    expect(paletteBillsSwrKey('acme')).not.toBe(paletteBillsSwrKey('acmo'));
  });
});

describe('isSearchableQuery', () => {
  it('rejects anything shorter than the minimum once trimmed', () => {
    expect(isSearchableQuery('')).toBe(false);
    expect(isSearchableQuery('   ')).toBe(false);
    expect(isSearchableQuery('a')).toBe(false);
    expect(isSearchableQuery(' a ')).toBe(false);
  });

  it('accepts a term at the minimum length', () => {
    expect(isSearchableQuery('a'.repeat(PALETTE_MIN_QUERY_LENGTH))).toBe(true);
    expect(isSearchableQuery('  acme  ')).toBe(true);
  });
});

describe('navigableItems', () => {
  it('offers only destinations that are actually built', () => {
    expect(navigableItems(SECTIONS).map((item) => item.href)).toEqual(['/bills', '/vendors']);
  });
});

describe('matchNavItems', () => {
  it('lists every built destination when nothing is typed', () => {
    expect(matchNavItems(SECTIONS, '').map((item) => item.label)).toEqual(['Bill Pay', 'Vendors']);
    expect(matchNavItems(SECTIONS, '   ')).toHaveLength(2);
  });

  it('matches labels case-insensitively on a substring', () => {
    expect(matchNavItems(SECTIONS, 'ven').map((item) => item.label)).toEqual(['Vendors']);
    expect(matchNavItems(SECTIONS, 'PAY').map((item) => item.label)).toEqual(['Bill Pay']);
  });

  it('never surfaces a disabled destination, even on an exact match', () => {
    expect(matchNavItems(SECTIONS, 'Insights')).toEqual([]);
  });
});

describe('billResultLabel', () => {
  it('uses the vendor name', () => {
    expect(billResultLabel(bill({}))).toBe('Acme Supply');
  });

  it('falls back rather than rendering a blank row for an unmatched draft', () => {
    expect(billResultLabel(bill({ vendor_name: null }))).toBe('Untitled bill');
  });
});

describe('billResultDescription', () => {
  it('leads with the invoice number, then the due date', () => {
    expect(billResultDescription(bill({}))).toBe('INV-2042 · Due Mar 3, 2026');
  });

  it('drops missing parts instead of padding them with an em dash', () => {
    expect(billResultDescription(bill({ invoice_number: null }))).toBe('Due Mar 3, 2026');
    expect(billResultDescription(bill({ due_date: null }))).toBe('INV-2042');
    expect(billResultDescription(bill({ invoice_number: null, due_date: null }))).toBe('');
  });
});
