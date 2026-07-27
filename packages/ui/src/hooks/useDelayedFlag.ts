'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useDelayedFlag — the anti-flash gate every loading indicator needs.
 *
 * Report the raw truth (`active`), receive a flag that is safe to RENDER. Two
 * asymmetric guards shape it:
 *
 * • **A rising delay.** Work that finishes inside `delayMs` shows nothing at
 *   all, because it was, for the user, instant. Painting a spinner for 60ms
 *   doesn't communicate "loading" — it reads as a glitch.
 *
 * • **A minimum lifetime.** Once the indicator IS up, it stays for
 *   `minVisibleMs` even if the work has already landed, so it can be perceived
 *   rather than glimpsed.
 *
 * Without the pair, a fast connection turns any busy indicator into a strobe:
 * on for two frames, off, on again on the next keystroke. That is a worse
 * result than no feedback, which is why this lives in one place and both the
 * `ProgressBar` rail and the app's nav-link spinner run through it.
 *
 */
export interface DelayedFlagOptions {
  /** How long `active` must hold before the flag rises (ms). Default 120. */
  delayMs?: number;
  /** Once raised, the minimum time the flag stays up (ms). Default 320. */
  minVisibleMs?: number;
}

/**
 * @param active Whether the underlying work is in flight.
 * @param delayMs
 * @param minVisibleMs
 * @returns Whether the indicator should be on screen right now.
 */
export function useDelayedFlag(
  active: boolean,
  { delayMs = 120, minVisibleMs = 320 }: DelayedFlagOptions = {},
): boolean {
  const [visible, setVisible] = useState(false);
  // When the flag last rose — the clock the minimum lifetime is measured from.
  const shownAt = useRef<number>(0);

  useEffect(() => {
    // Rising edge: wait out `delayMs` before committing to showing anything. If
    // `active` drops first, the cleanup cancels the timer and nothing renders.
    if (active) {
      if (visible) return;
      const timer = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, delayMs);
      return () => clearTimeout(timer);
    }

    // Falling edge: if the flag never rose there is nothing to tear down.
    if (!visible) return;
    const remaining = Math.max(0, minVisibleMs - (Date.now() - shownAt.current));
    const timer = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(timer);
  }, [active, visible, delayMs, minVisibleMs]);

  return visible;
}
