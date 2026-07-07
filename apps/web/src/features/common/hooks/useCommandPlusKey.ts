'use client';

import { useEffect, useRef } from 'react';

/**
 * useCommandPlusKey — fire a handler on the "command + <key>" chord, where
 * "command" is ⌘ on Apple keyboards and Ctrl everywhere else (the platform is
 * read off the actual event's `metaKey`/`ctrlKey`, so it's correct per-keystroke
 * without any UA sniffing here).
 *
 * The listener is attached to `document` and torn down with an AbortController:
 * `addEventListener(..., { signal })` then `controller.abort()` on cleanup wipes
 * the listener in one call, no matching remove-callback to keep in sync. The
 * chord (`key`) can change between renders; the handler is held in a ref so a
 * new closure each render doesn't re-bind the listener (or drop keystrokes
 * mid-press).
 *
 * @param key the letter/character to combine with ⌘/Ctrl, e.g. `'k'`. Compared
 *   case-insensitively against `event.key`.
 * @param handler run with the originating event when the chord fires. Call
 *   `event.preventDefault()` inside to stop the browser default (⌘K opens the
 *   URL bar's search in some browsers).
 * @param enabled bind the listener only while truthy (default `true`) — lets a
 *   caller disable the shortcut without unmounting.
 */
export function useCommandPlusKey(
  key: string,
  handler: (event: KeyboardEvent) => void,
  enabled = true,
): void {
  // Hold the latest handler so changing it doesn't re-bind the listener. The
  // ref is synced in its own effect (never during render) so a new closure each
  // render still routes to the freshest handler without re-attaching keydown.
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    const target = key.toLowerCase();

    document.addEventListener(
      'keydown',
      (event) => {
        // ⌘ on Apple, Ctrl elsewhere — accept whichever the OS sends.
        const commandHeld = event.metaKey || event.ctrlKey;
        if (commandHeld && event.key.toLowerCase() === target) {
          handlerRef.current(event);
        }
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, [key, enabled]);
}
