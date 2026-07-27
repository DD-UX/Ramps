import { describe, expect, it } from 'vitest';

import { buildSearchQuery, normalizeSearchParam } from './search-query.helpers';

/**
 * buildSearchQuery is the URL math behind every list page's search box — Bill
 * Pay's and Vendors' alike, which is why it lives in `common`. It must set `?q=`
 * on a real term, drop it when the field clears, and — in every case — leave the
 * other params (above all `?tab=`) untouched, so searching never wipes the
 * active tab.
 */
describe('buildSearchQuery', () => {
  it('sets ?q= to the (trimmed) term', () => {
    expect(buildSearchQuery('', 'acme')).toBe('q=acme');
    expect(buildSearchQuery('', '  acme  ')).toBe('q=acme');
  });

  it('drops ?q= when the term is empty or whitespace', () => {
    expect(buildSearchQuery('q=old', '')).toBe('');
    expect(buildSearchQuery('q=old', '   ')).toBe('');
  });

  it('replaces an existing ?q= rather than appending a second one', () => {
    expect(buildSearchQuery('q=old', 'new')).toBe('q=new');
  });

  it('preserves every other param when setting ?q= (notably ?tab=)', () => {
    const next = buildSearchQuery('tab=for_approval', 'acme');
    const params = new URLSearchParams(next);
    expect(params.get('tab')).toBe('for_approval');
    expect(params.get('q')).toBe('acme');
  });

  it('preserves ?tab= when the search clears', () => {
    const next = buildSearchQuery('tab=for_approval&q=old', '');
    const params = new URLSearchParams(next);
    expect(params.get('tab')).toBe('for_approval');
    expect(params.has('q')).toBe(false);
  });

  it('accepts a leading-? query string and other multi-params', () => {
    const next = buildSearchQuery('?tab=history&sort=due', 'acme co');
    const params = new URLSearchParams(next);
    expect(params.get('tab')).toBe('history');
    expect(params.get('sort')).toBe('due');
    expect(params.get('q')).toBe('acme co');
  });

  it('resets pagination — drops ?page= — when the term changes or clears', () => {
    const set = new URLSearchParams(buildSearchQuery('tab=history&page=3', 'acme'));
    expect(set.get('tab')).toBe('history');
    expect(set.get('q')).toBe('acme');
    expect(set.has('page')).toBe(false);

    const cleared = new URLSearchParams(buildSearchQuery('tab=history&q=old&page=2', ''));
    expect(cleared.get('tab')).toBe('history');
    expect(cleared.has('q')).toBe(false);
    expect(cleared.has('page')).toBe(false);
  });

  /**
   * The page reset is unconditional, which is what let the two former per-feature
   * copies collapse into one. On a list that doesn't paginate (Vendors today)
   * there is no `?page=` to remove, so the rule costs nothing — and the day that
   * list grows a pager it is already correct rather than quietly one commit
   * behind, which is how the copies had drifted in the first place.
   */
  it('is a no-op on the page reset for a query that carries no ?page=', () => {
    expect(buildSearchQuery('tab=active', 'acme')).toBe('tab=active&q=acme');
    expect(buildSearchQuery('tab=active&q=old', '')).toBe('tab=active');
  });
});

/**
 * normalizeSearchParam turns the raw `?q=` the page reads into what the SDK
 * wants: a trimmed non-empty term, or `undefined` for "no filter" — so a bare
 * `?q=` never runs an empty ILIKE scan. It's the read-side twin of the
 * write-side buildSearchQuery.
 */
describe('normalizeSearchParam', () => {
  it('trims a real term', () => {
    expect(normalizeSearchParam('acme')).toBe('acme');
    expect(normalizeSearchParam('  acme co  ')).toBe('acme co');
  });

  it('collapses missing / empty / whitespace-only to undefined', () => {
    expect(normalizeSearchParam(undefined)).toBeUndefined();
    expect(normalizeSearchParam('')).toBeUndefined();
    expect(normalizeSearchParam('   ')).toBeUndefined();
  });
});
