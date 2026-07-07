'use client';

import { useEffect, useRef } from 'react';

/**
 * usePrevious — the value a watched input held on the PREVIOUS commit, kept in a
 * ref (not state) so reading it never triggers a re-render and it adds nothing
 * to any effect's dependency list. It returns ONLY the previous value; the
 * current value is already in the caller's hands (they passed it in), so the
 * hook doesn't mirror it. Compare `prev !== value` in an effect or handler.
 *
 * ```ts
 * const prevCount = usePrevious(count);
 * useEffect(() => {
 *   if (prevCount !== undefined && count > prevCount) onIncrease();
 * }, [count]); // prevCount is a ref read — deliberately not a dependency
 * ```
 *
 * How it stays lint-clean: the kit's React Compiler rules forbid writing a ref
 * during render (`react-hooks/refs`), so the ref is advanced INSIDE an effect —
 * the same pattern {@link useClickAway} uses. That means it updates AFTER commit,
 * one render behind:
 * - During render N the ref still holds render N-1's value (its "previous").
 * - The effect then stores N so render N+1 sees N as "previous".
 *
 * The one-render lag is exactly why this is for effects/handlers (post-commit
 * reads), NOT for render-time "adjust state when a prop changed" logic — that
 * needs the transition on the SAME render and should use the state-mirror
 * pattern instead (https://react.dev/reference/react/useState#storing-information-from-previous-renders).
 *
 * On the first commit it returns the `initial` value (default `undefined`).
 */
export function usePrevious<T>(value: T): T | undefined;
export function usePrevious<T>(value: T, initial: T): T;
export function usePrevious<T>(value: T, initial?: T): T | undefined {
  const previous = useRef<T | undefined>(initial);

  // Store the latest value AFTER commit so the next render's read sees it as
  // "previous". Writing the ref in an effect (not during render) keeps this
  // clean under react-hooks/refs.
  useEffect(() => {
    previous.current = value;
  }, [value]);

  // Reading a ref during render is normally banned (react-hooks/refs) because a
  // render-time read can miss updates — but that's precisely this hook's job:
  // hand back the value from the PRIOR commit. The ref is only ever written in
  // the effect above, never during render, so this read is stable for the whole
  // render. This one deliberate read is the reason the hook exists.
  // eslint-disable-next-line react-hooks/refs
  return previous.current;
}
