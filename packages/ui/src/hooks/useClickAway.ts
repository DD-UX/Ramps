'use client';

import { type RefObject, useEffect, useRef } from 'react';

export interface UseClickAwayOptions {
  /** Master switch — pass the open state so the listeners only exist while shown. */
  enabled?: boolean;
  /** Also dismiss on the Escape key (default true). */
  escape?: boolean;
}

/**
 * useClickAway — the shared dismissal contract for every floating surface in
 * the kit (Popover in click mode, Modal, and anything else that must close
 * when the user clicks elsewhere or hits Esc).
 *
 * Pass one ref (or several — trigger + portal'd panel) that count as "inside";
 * any `pointerdown` outside all of them, or an Escape keydown, calls `onAway`.
 *
 * Details that matter:
 * - Listens on `pointerdown` (not click) so the surface closes before a
 *   click elsewhere lands — matching how the real product's menus feel.
 * - The callback is kept in a ref, so callers may pass inline closures
 *   without re-subscribing listeners every render.
 * - `enabled` gates everything: when the surface is closed there are zero
 *   document listeners.
 */
export function useClickAway(
  refs: RefObject<HTMLElement | null> | ReadonlyArray<RefObject<HTMLElement | null>>,
  onAway: () => void,
  { enabled = true, escape = true }: UseClickAwayOptions = {},
): void {
  const list = Array.isArray(refs)
    ? (refs as ReadonlyArray<RefObject<HTMLElement | null>>)
    : [refs as RefObject<HTMLElement | null>];

  // Keep the latest callback + ref list in refs, synced INSIDE an effect
  // (react-hooks/refs forbids render-time writes), so the listener effect
  // below never re-subscribes because a caller passed an inline closure or
  // an inline `[triggerRef, panelRef]` array.
  const onAwayRef = useRef(onAway);
  const listRef = useRef(list);
  useEffect(() => {
    onAwayRef.current = onAway;
    listRef.current = list;
  });

  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const inside = listRef.current.some((r) => r.current?.contains(target));
      if (!inside) onAwayRef.current();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (escape && event.key === 'Escape') onAwayRef.current();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled, escape]);
}
