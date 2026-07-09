import { describe, expect, it } from 'vitest';

import { NAV_SECTIONS } from '../constants/nav.constants';
import {
  duplicateNavHrefs,
  isNavItemActive,
  navHrefs,
  type NavIcon,
  type NavSection,
} from './nav.helpers';

/** A stand-in icon for the pure-function fixtures (a component, like the real
 *  lucide icons — never rendered here, just carried as data). */
const StubIcon: NavIcon = () => null;

/**
 * isNavItemActive is the stone-highlight rule: EXACT href match against the
 * current route. Exact (not prefix) so `/` doesn't light for every page and a
 * shared href can't highlight two items.
 */
describe('isNavItemActive', () => {
  it('is active on an exact match', () => {
    expect(isNavItemActive('/bills', '/bills')).toBe(true);
  });

  it('is not active on a different route', () => {
    expect(isNavItemActive('/bills', '/vendors')).toBe(false);
  });

  it('does not prefix-match — "/" only lights on "/"', () => {
    expect(isNavItemActive('/', '/bills')).toBe(false);
    expect(isNavItemActive('/', '/')).toBe(true);
  });

  it('is not active when the pathname is null (SSR / no route yet)', () => {
    expect(isNavItemActive('/bills', null)).toBe(false);
  });
});

/**
 * navHrefs flattens the sections into every advertised href, in render order —
 * the list the route layer walks to guarantee each nav target has a page.
 */
describe('navHrefs', () => {
  it('flattens sections in order', () => {
    const sections: NavSection[] = [
      [
        { label: 'A', href: '/a', icon: StubIcon },
        { label: 'B', href: '/b', icon: StubIcon },
      ],
      [{ label: 'C', href: '/c', icon: StubIcon }],
    ];
    expect(navHrefs(sections)).toEqual(['/a', '/b', '/c']);
  });

  it('is empty for an empty nav', () => {
    expect(navHrefs([])).toEqual([]);
  });
});

/**
 * duplicateNavHrefs backs the config's promise of being the single source for
 * the route table: any href appearing twice is a bug (it would light two items
 * for one route and blur which page an href owns).
 */
describe('duplicateNavHrefs', () => {
  it('reports nothing when every href is unique', () => {
    const sections: NavSection[] = [
      [{ label: 'A', href: '/a', icon: StubIcon }],
      [{ label: 'B', href: '/b', icon: StubIcon }],
    ];
    expect(duplicateNavHrefs(sections)).toEqual([]);
  });

  it('reports an href repeated across sections', () => {
    const sections: NavSection[] = [
      [{ label: 'A', href: '/dupe', icon: StubIcon }],
      [{ label: 'B', href: '/dupe', icon: StubIcon }],
    ];
    expect(duplicateNavHrefs(sections)).toEqual(['/dupe']);
  });
});

/**
 * The real config. These lock the nav's contract: sections exist, every href
 * is unique, Bill Pay owns /bills (and lights there — nothing else does), and
 * Bill Pay carries the badge the frame shows.
 */
describe('NAV_SECTIONS (the shipped nav)', () => {
  const items = NAV_SECTIONS.flat();

  it('has the three hairline-separated sections', () => {
    expect(NAV_SECTIONS).toHaveLength(3);
    expect(NAV_SECTIONS.every((section) => section.length > 0)).toBe(true);
  });

  it('advertises only unique hrefs (single source for the route table)', () => {
    expect(duplicateNavHrefs(NAV_SECTIONS)).toEqual([]);
  });

  it('gives every item a label, href, and icon', () => {
    for (const item of items) {
      expect(item.label, 'label is set').toBeTruthy();
      expect(item.href.startsWith('/'), `${item.label} href is a route`).toBe(true);
      // Icons are component references (lucide forwardRef objects or functions).
      expect(['function', 'object'], `${item.label} has an icon component`).toContain(
        typeof item.icon,
      );
      expect(item.icon, `${item.label} icon is present`).toBeTruthy();
    }
  });

  it('routes Bill Pay to /bills and lights it there — and only it', () => {
    const billPay = items.find((item) => item.label === 'Bill Pay');
    expect(billPay?.href).toBe('/bills');
    const activeOnBills = items.filter((item) => isNavItemActive(item.href, '/bills'));
    expect(activeOnBills.map((item) => item.label)).toEqual(['Bill Pay']);
  });

  it('carries the badge on Insights (the frame\u2019s count), not Bill Pay', () => {
    const insights = items.find((item) => item.label === 'Insights');
    expect(insights?.badge).toBe(2);
    const billPay = items.find((item) => item.label === 'Bill Pay');
    expect(billPay?.badge).toBeUndefined();
  });
});
