import { describe, expect, it } from 'vitest';

import { buildPageQuery, normalizePageParam } from './page-query.helpers';

/**
 * normalizePageParam turns the raw `?page=` the loader reads into a 1-based
 * page number for the SDK — clamping anything that isn't a positive integer
 * back to page 1 so a hand-typed URL can't ask for a nonsensical page.
 */
describe('normalizePageParam', () => {
  it('accepts a positive integer page', () => {
    expect(normalizePageParam('2')).toBe(2);
    expect(normalizePageParam('10')).toBe(10);
  });

  it('collapses missing / empty to 1', () => {
    expect(normalizePageParam(undefined)).toBe(1);
    expect(normalizePageParam('')).toBe(1);
  });

  it('collapses zero, negatives, decimals, and garbage to 1', () => {
    expect(normalizePageParam('0')).toBe(1);
    expect(normalizePageParam('-3')).toBe(1);
    expect(normalizePageParam('2.5')).toBe(1);
    expect(normalizePageParam('abc')).toBe(1);
  });
});

/**
 * buildPageQuery is the write-side: it sets `?page=` for pages past the first,
 * drops it on page 1 (the bare list IS page 1), and leaves every other param —
 * above all `?tab=` and `?q=` — untouched, so flipping pages preserves the tab
 * and the search.
 */
describe('buildPageQuery', () => {
  it('sets ?page= for pages past the first', () => {
    expect(buildPageQuery('', 2)).toBe('page=2');
    expect(buildPageQuery('', 5)).toBe('page=5');
  });

  it('drops ?page= on page 1', () => {
    expect(buildPageQuery('page=3', 1)).toBe('');
  });

  it('replaces an existing ?page= rather than appending a second one', () => {
    expect(buildPageQuery('page=2', 4)).toBe('page=4');
  });

  it('preserves ?tab= and ?q= when setting the page', () => {
    const next = buildPageQuery('tab=for_payment&q=acme', 3);
    const params = new URLSearchParams(next);
    expect(params.get('tab')).toBe('for_payment');
    expect(params.get('q')).toBe('acme');
    expect(params.get('page')).toBe('3');
  });

  it('preserves ?tab= when returning to page 1', () => {
    const next = buildPageQuery('tab=history&page=2', 1);
    const params = new URLSearchParams(next);
    expect(params.get('tab')).toBe('history');
    expect(params.has('page')).toBe(false);
  });

  it('accepts a leading-? query string', () => {
    const next = buildPageQuery('?tab=drafts', 2);
    const params = new URLSearchParams(next);
    expect(params.get('tab')).toBe('drafts');
    expect(params.get('page')).toBe('2');
  });
});
