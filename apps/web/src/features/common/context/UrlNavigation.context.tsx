'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useTransition,
} from 'react';

/**
 * UrlNavigationContext — one shared React transition for every control that
 * changes this page's URL STATE (the Bill Pay tabs, the search field, the
 * table's pager).
 *
 * ## Why this exists
 *
 * These surfaces are Server Components keyed off `?tab=` / `?q=` / `?page=`, so
 * "switch a tab" is really "navigate, re-run the query, re-render on the
 * server". Next gives that navigation no feedback of its own, and two Next
 * behaviours conspire to make it feel BROKEN rather than merely slow:
 *
 *  1. `loading.tsx` does NOT fire. It is a segment-mount boundary; changing a
 *     search param doesn't remount `/bills` (vercel/next.js#53543, #42346). So
 *     the route-level skeleton this app now ships never covers a tab switch.
 *  2. The URL does not update until the server render RESOLVES. Since the
 *     active tab is derived from `?tab=`, the clicked tab doesn't even
 *     highlight until the data lands — the entire interval is dead.
 *
 * Wrapping the `router.push` in `startTransition` fixes both halves. `isPending`
 * stays true from click until the new server payload commits, which is exactly
 * the window that needs an indicator; and because the update is a transition,
 * `useOptimistic` state (the tab highlight — see `BillsTabs`) is allowed to run
 * ahead of the URL and is reverted automatically if the navigation fails.
 *
 * ## Why a context and not a hook per control
 *
 * The pending flag is raised by the TABS but drawn by a rail that is their
 * SIBLING, and the component between them (`BillsPageContent`) is a Server
 * Component that cannot hold state. A context is the seam: this provider is the
 * one client boundary, and its children — tabs, toolbar, table, rail — stay
 * server-rendered because they arrive as `children`.
 *
 * `navigate` is deliberately the only way out. Every URL-state control routes
 * through it, so none can accidentally ship a navigation with no feedback.
 */
export interface UrlNavigationValue {
  /** True from the click until the new server render commits. */
  isPending: boolean;
  /**
   * Navigate to `href` inside the shared transition.
   *
   * `optimistic` runs in the SAME transition, before the push — that placement
   * is load-bearing. A `useOptimistic` setter called outside a transition
   * throws; called inside this one, its value survives until the navigation
   * settles and rolls back on failure.
   *
   * `replace` swaps the history entry instead of pushing one — the search field
   * uses it so a debounced keystroke doesn't bury the previous page in the back
   * stack.
   */
  navigate: (href: string, options?: { optimistic?: () => void; replace?: boolean }) => void;
  /** The current pathname — saves each control its own `usePathname()`. */
  pathname: string;
  /** The current query string, for controls that rebuild it. */
  search: string;
}

const UrlNavigationContext = createContext<UrlNavigationValue | null>(null);

export function UrlNavigationProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback<UrlNavigationValue['navigate']>(
    (href, { optimistic, replace = false } = {}) => {
      startTransition(() => {
        optimistic?.();
        if (replace) router.replace(href);
        else router.push(href);
      });
    },
    [router],
  );

  const value = useMemo<UrlNavigationValue>(
    () => ({ isPending, navigate, pathname, search: searchParams.toString() }),
    [isPending, navigate, pathname, searchParams],
  );

  return <UrlNavigationContext.Provider value={value}>{children}</UrlNavigationContext.Provider>;
}

/**
 * Read the shared URL-navigation transition.
 *
 * Throws outside a provider rather than degrading to a no-op: a control that
 * navigates without feedback is the exact defect this context was added to
 * remove, so failing loudly at mount is preferable to shipping it silently.
 */
export function useUrlNavigation(): UrlNavigationValue {
  const value = useContext(UrlNavigationContext);
  if (!value) {
    throw new Error('useUrlNavigation must be used within a <UrlNavigationProvider>.');
  }
  return value;
}
