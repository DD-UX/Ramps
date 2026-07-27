'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useUrlNavigation } from '../context/UrlNavigation.context';
import { buildSearchQuery } from '../helpers/search-query.helpers';

/**
 * useDebouncedSearchNavigation — the wiring behind a list page's search box:
 * hold the keystrokes locally, and once the user pauses, fold the term into the
 * URL through the shared navigation transition.
 *
 * ## Why this is shared, when the toolbars around it are not
 *
 * Bill Pay's and Vendors' toolbars look alike, but most of that likeness is
 * coincidental — the disabled Status / columns / export / Options cluster is
 * identical only because both mirror the same reference screenshot, and it will
 * diverge the moment either becomes real (one filters `status`, the other
 * `review_state`). Deduplicating THAT would couple two things designed to split.
 *
 * This part is different. "Debounce a term, then replace the URL with it" knows
 * nothing about bills or vendors — no entity, no column, no status vocabulary.
 * It is one concern with two callers, and it was being maintained twice: the
 * transition-routing change that added the activity rail had to be written into
 * both toolbars by hand, which is how the duplication announced itself.
 *
 * ## The two decisions it encodes
 *
 * • **Debounced.** Every keystroke resets the timer, so a navigation happens
 *   once the user pauses rather than once per character. Each commit is a
 *   server round-trip; per-keystroke would queue renders the user never reads.
 *
 * • **`replace`, not `push`.** A debounced search must not leave one history
 *   entry per pause. Back should exit the search, not walk it backwards a word
 *   at a time.
 *
 * The field itself stays CONTROLLED by local state, seeded from the URL, so a
 * shared `?q=` link lands populated while typing stays instant — the input must
 * never wait on a server render to show the character just typed.
 */

/** How long to wait after the last keystroke before navigating (ms). */
const SEARCH_DEBOUNCE_MS = 300;

export interface DebouncedSearchNavigation {
  /** The controlled input value — local, so typing never awaits the server. */
  value: string;
  /** Feed every keystroke here; the navigation is scheduled, not immediate. */
  onChange: (next: string) => void;
}

/**
 * @param initialSearch the `?q=` value the page loaded with, used to seed the
 *   field. Accepts `null`/`undefined` so callers can pass a nullable column
 *   type straight through.
 * @param debounceMs override the pause length before navigating.
 */
export function useDebouncedSearchNavigation(
  initialSearch: string | null | undefined,
  debounceMs: number = SEARCH_DEBOUNCE_MS,
): DebouncedSearchNavigation {
  const { navigate, pathname, search } = useUrlNavigation();

  const [value, setValue] = useState(initialSearch ?? '');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Push `?q=` (trimmed; dropped when empty) while preserving every other param
  // — notably `?tab=` — so searching never clears the active tab. The URL math
  // lives in buildSearchQuery so it's unit-tested without a DOM.
  const commit = useCallback(
    (next: string) => {
      const query = buildSearchQuery(search, next);
      navigate(query ? `${pathname}?${query}` : pathname, { replace: true });
    },
    [navigate, pathname, search],
  );

  // Drop a scheduled navigation if the toolbar unmounts mid-pause. Deliberately
  // does NOT flush: navigating away from a page the user just left would fight
  // whatever they navigated to.
  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  const onChange = useCallback(
    (next: string) => {
      setValue(next);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => commit(next), debounceMs);
    },
    [commit, debounceMs],
  );

  return { value, onChange };
}
