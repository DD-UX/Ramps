'use client';

import { useEffect, useState } from 'react';

/**
 * useDebouncedValue — trail a fast-changing value by a quiet period.
 *
 * The sibling of `useDebouncedSearchNavigation`, split from it because the two
 * debounce different things: that hook debounces an EFFECT (a URL replace) and
 * so owns the navigation, while this one debounces a VALUE the caller then
 * uses as a cache key. A palette needs the second shape — the field must
 * repaint every keystroke while the SWR key it feeds moves only on a pause, so
 * typing never queues one request per character.
 *
 * The timer is the effect's own cleanup, which is what makes it correct under
 * rapid input: each new `value` tears down the pending timeout before arming
 * the next, so only a genuine pause survives to commit.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
