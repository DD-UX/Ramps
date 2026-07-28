'use client';

import { type RefObject, useLayoutEffect } from 'react';

/**
 * useSwapScrollTop — the animated scroll-to-top when KEYED content swaps
 * inside a persistent scroll container slot.
 *
 * The pattern it serves: a screen keys a subtree by record id (`key={id}` —
 * load-bearing for per-record state, e.g. the bill form), so hopping records
 * REMOUNTS the scroller and the scroll hard-cuts to 0 — you're suddenly at
 * the top with no sense of travel. This hook restores the travel: the
 * outgoing mount's cleanup captures the container's scrollTop into a ref
 * owned ABOVE the keyed boundary (the screen survives hops; only its child
 * is keyed), and the incoming mount starts the new container at that carried
 * offset — before paint, in a layout effect, so the top never flashes — then
 * glides it to 0 with the browser's own smooth scroll. Native
 * `scrollTo({ behavior: 'smooth' })` over a JS tween on purpose: the browser
 * cancels it the moment the user scrolls, so the glide never fights the
 * wheel.
 *
 * The browser clamps the carried offset to the incoming content's reach (a
 * partially-loaded mount can be shorter than the full record), so the glide
 * starts from wherever the new content can actually stand. Rapid hops chain
 * naturally: a mid-glide unmount captures the mid-glide offset.
 *
 * Reduced motion (or no carried offset — a cold first mount) keeps the plain
 * behavior: mount at the top, no travel. Re-renders under the SAME key never
 * replay the glide — the carried value is consumed on mount.
 *
 * Wiring: mount it INSIDE the swapped subtree, next to the scroller; own the
 * carried ref (`useRef(0)`) somewhere that PROVABLY outlives the swap. Be
 * suspicious here: on a route-param navigation Next remounts the segment's
 * whole client tree — page component included — so "the component above the
 * `key=`" can silently die with the hop and hand every mount a fresh 0. A
 * layout-level provider is the safe home. First consumer: the bill-details
 * left pane across rail hops, parking in `BillRailProvider`.
 */
export function useSwapScrollTop(
  scrollerRef: RefObject<HTMLElement | null>,
  carriedScrollTopRef: RefObject<number>,
) {
  useLayoutEffect(() => {
    const pane = scrollerRef.current;
    if (!pane) return;

    const carried = carriedScrollTopRef.current;
    carriedScrollTopRef.current = 0;
    // matchMedia checked imperatively (not via a hook): a preference flip
    // mid-mount must not re-run this effect — that would replay the glide on
    // a bill the user is already reading. jsdom has no matchMedia; guarded.
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (carried > 0 && !reduceMotion) {
      pane.scrollTop = carried; // clamped by the browser to the new content
      if (pane.scrollTop > 0 && typeof pane.scrollTo === 'function') {
        pane.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    return () => {
      // Outgoing capture — read at cleanup time, while the pane still exists,
      // so the NEXT mount knows where the eye was.
      carriedScrollTopRef.current = pane.scrollTop;
    };
  }, [scrollerRef, carriedScrollTopRef]);
}
