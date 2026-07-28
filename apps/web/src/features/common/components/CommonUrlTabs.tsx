'use client';

import { Tabs } from '@ramps/ui/Tabs';
import { useCallback, useOptimistic } from 'react';

import { useUrlNavigation } from '../context/UrlNavigation.context';

/**
 * CommonUrlTabs — the URL-driven tab bar shared by Bill Pay and Vendors.
 *
 * The active tab is the URL's `?tab=` param (a tab `code`), not React state:
 * both pages are Server Components that re-query per tab, so switching tabs is
 * a navigation, not a client fetch. This keeps the single Zod gate (the facade
 * parse) as the only validation boundary and the URL shareable.
 *
 * ## Why the highlight is optimistic
 *
 * Deriving the active tab from the URL has one nasty consequence: Next does not
 * commit the new URL until the server render RESOLVES, so a plain `router.push`
 * leaves the clicked tab un-highlighted for the whole round trip. The bar
 * looked frozen — the click appeared to do nothing.
 *
 * `useOptimistic` splits those two facts apart. The tab you clicked becomes
 * active immediately (the underline glides on the same frame as the press),
 * while `?tab=` remains the source of truth underneath. When the navigation
 * commits, the optimistic value is dropped and the prop takes over — the value
 * is identical, so nothing moves. If the navigation FAILS, React discards the
 * optimistic value and the bar snaps back to the tab that is genuinely open,
 * which is the honest outcome: we never leave a tab highlighted for a list that
 * isn't showing.
 *
 * The setter must run inside a transition, which is why navigation goes through
 * {@link useUrlNavigation} rather than `router.push` directly — the same
 * transition also raises the activity rail beneath the toolbar.
 *
 * Each feature keeps its own `tabHref` (the "default tab drops the param" rule
 * is per-catalog and unit-tested there); this component owns only the shared
 * optimistic-navigation choreography around it.
 */
export interface CommonUrlTabsProps {
  /** The tab catalog, in display order — the first row is the default. */
  tabs: readonly { code: string; name: string }[];
  /** The active tab's `code` (the default's code when unfiltered). */
  activeCode: string;
  /** Per-tab count badges keyed by tab `code`; omit for a badge-less bar. */
  counts?: Record<string, number>;
  /** The feature's own href rule for a tab switch. */
  tabHref: (pathname: string, code: string, defaultCode: string | undefined) => string;
}

export function CommonUrlTabs({ tabs, activeCode, counts, tabHref }: CommonUrlTabsProps) {
  const { navigate, pathname } = useUrlNavigation();

  // Seeded from the URL-derived prop; runs ahead of it only while a tab
  // navigation is in flight.
  const [optimisticCode, setOptimisticCode] = useOptimistic(activeCode);

  // The default tab is the first row (the catalog's own order) — no hardcoded
  // slug. Switching to it drops the param rather than writing ?tab=<default>.
  const defaultCode = tabs[0]?.code;

  const onValueChange = useCallback(
    (next: string) => {
      navigate(tabHref(pathname, next, defaultCode), {
        optimistic: () => setOptimisticCode(next),
      });
    },
    [navigate, tabHref, pathname, defaultCode, setOptimisticCode],
  );

  const tabItems = tabs.map((tab) => ({
    value: tab.code,
    label: tab.name,
    count: counts?.[tab.code],
  }));

  return (
    <Tabs
      tabs={tabItems}
      value={optimisticCode}
      onValueChange={onValueChange}
      className="px-rui-6"
    />
  );
}
