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
 * SIBLING; a context is the seam that lets the two agree without the surface
 * between them threading callbacks. The provider is one client boundary, and
 * on server-composed pages (Vendors) its children stay server-rendered
 * because they arrive as `children`.
 *
 * `navigate` is deliberately the only way out. Every URL-state control routes
 * through it, so none can accidentally ship a navigation with no feedback.
 *
 * ## The `shallow` mode
 *
 * The controls above don't care HOW the URL changes — only that it does, with
 * feedback. So the TRANSPORT is the provider's decision, not theirs:
 * - default: `router.push`/`router.replace` — a real navigation that re-runs
 *   the Server Component (Vendors still queries per URL change).
 * - `shallow`: `window.history.pushState`/`replaceState` — Next folds a
 *   history-API call into `usePathname`/`useSearchParams` WITHOUT re-running
 *   the server. Bill Pay uses this: its tabs/search/pager are pure client
 *   derivations over the SWR-cached category, so a server round trip per
 *   click would be paying for data the client already holds. Same consumer
 *   code, one prop.
 *
 * In shallow mode the transition settles almost immediately (there's no
 * server payload to wait for), so `isPending` alone would under-report. The
 * `pending` prop is the surface's own signal — Bill Pay passes its SWR
 * `isLoading` for an uncached category — OR-ed into `isPending` so the same
 * rail covers both transports.
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

export interface UrlNavigationProviderProps extends PropsWithChildren {
  /**
   * Use the history API instead of the router: the URL (and every
   * `useSearchParams` reader) updates, but the Server Component does NOT
   * re-run. For surfaces whose data is a client derivation (Bill Pay).
   */
  shallow?: boolean;
  /**
   * The surface's own loading signal, OR-ed into `isPending` — shallow
   * navigation settles instantly, so the data fetch it triggers (an SWR miss)
   * must report through here to keep the rail honest.
   */
  pending?: boolean;
}

export function UrlNavigationProvider({
  children,
  shallow = false,
  pending = false,
}: UrlNavigationProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback<UrlNavigationValue['navigate']>(
    (href, { optimistic, replace = false } = {}) => {
      startTransition(() => {
        optimistic?.();
        if (shallow) {
          // Next folds history-API calls into its router state, so
          // `usePathname`/`useSearchParams` update without a server render.
          if (replace) window.history.replaceState(null, '', href);
          else window.history.pushState(null, '', href);
        } else if (replace) {
          router.replace(href);
        } else {
          router.push(href);
        }
      });
    },
    [router, shallow],
  );

  const value = useMemo<UrlNavigationValue>(
    () => ({
      isPending: isPending || pending,
      navigate,
      pathname,
      search: searchParams.toString(),
    }),
    [isPending, pending, navigate, pathname, searchParams],
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
