import type { ComponentType } from 'react';

/**
 * The nav model + the pure logic behind CommonSideMenu, split out of the
 * component so it can be unit-tested without a DOM or a router. The component
 * owns the RENDER (slots, JSX); this owns the DATA SHAPE and the two decisions
 * that have real behaviour: which item is active, and the invariant that the
 * config's hrefs stay unique (a duplicate href would light two items at once
 * and split the "single source for the route table" promise).
 */

/** The lucide-style icon a nav item carries — a component, not a rendered node,
 *  so the config is plain data (a `.constants.ts`, testable without JSX). */
export type NavIcon = ComponentType<{ width?: number; height?: number }>;

/** One nav entry — a labelled link with a leading icon and an optional badge. */
export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
  badge?: number;
};

/**
 * A section is a run of items separated from its neighbours by a hairline (the
 * frame's three divider rules: Home/Insights · Manage spend…Financial accounts ·
 * Accounting…Company).
 */
export type NavSection = NavItem[];

/**
 * Is this item the active one for the current route? Exact-match on href — the
 * item whose href equals the pathname wins the stone highlight. Exact (not
 * prefix) so `/` doesn't light up for every route, and a shared href can't
 * highlight two items.
 */
export function isNavItemActive(href: string, pathname: string | null): boolean {
  return pathname === href;
}

/** Every href the nav advertises, flattened across sections, in render order. */
export function navHrefs(sections: NavSection[]): string[] {
  return sections.flatMap((section) => section.map((item) => item.href));
}

/**
 * The hrefs that appear more than once across the whole nav. The config is the
 * single source for the route table, so this MUST be empty — a duplicate would
 * both light two items for one route and blur which page an href owns.
 */
export function duplicateNavHrefs(sections: NavSection[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const href of navHrefs(sections)) {
    if (seen.has(href)) dupes.add(href);
    else seen.add(href);
  }
  return [...dupes];
}
