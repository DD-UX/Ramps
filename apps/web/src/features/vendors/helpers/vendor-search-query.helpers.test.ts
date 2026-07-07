import { describe, expect, it } from 'vitest';

import { buildSearchQuery, normalizeSearchParam } from './vendor-search-query.helpers';

/**
 * Search is a URL-state control, exactly like the tabs: committing a term sets
 * `?q=`, clearing it drops it, and every OTHER param (notably `?tab=`) survives.
 */
describe('buildSearchQuery', () => {
  it('sets ?q= for a non-empty term', () => {
    expect(buildSearchQuery('', 'acme')).toBe('q=acme');
  });

  it('trims the term before setting it', () => {
    expect(buildSearchQuery('', '  acme  ')).toBe('q=acme');
  });

  it('drops ?q= when the term is empty / whitespace', () => {
    expect(buildSearchQuery('q=old', '')).toBe('');
    expect(buildSearchQuery('q=old', '   ')).toBe('');
  });

  it('preserves other params (notably ?tab=)', () => {
    expect(buildSearchQuery('tab=active', 'acme')).toBe('tab=active&q=acme');
    expect(buildSearchQuery('tab=active&q=old', '')).toBe('tab=active');
  });

  it('accepts a query string with or without a leading ?', () => {
    expect(buildSearchQuery('?tab=active', 'acme')).toBe('tab=active&q=acme');
  });
});

describe('normalizeSearchParam', () => {
  it('trims a real term', () => {
    expect(normalizeSearchParam('  acme  ')).toBe('acme');
  });

  it('collapses missing / whitespace-only to undefined', () => {
    expect(normalizeSearchParam(undefined)).toBeUndefined();
    expect(normalizeSearchParam('')).toBeUndefined();
    expect(normalizeSearchParam('   ')).toBeUndefined();
  });
});
