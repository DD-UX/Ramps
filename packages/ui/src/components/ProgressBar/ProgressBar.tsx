'use client';

import { motion, useReducedMotion } from 'motion/react';

import { useDelayedFlag } from '../../hooks/useDelayedFlag';
import { cn } from '../../lib/cn';

/**
 * ProgressBar — the hairline INDETERMINATE activity rail.
 *
 * Where `Skeleton` stands in for content whose shape is known and `Spinner`
 * marks a single control as busy, this marks a whole REGION as refreshing while
 * its current contents stay readable: a 2px rail spanning the content width with
 * a token-tinted segment sweeping across it. It is the right instrument when a
 * surface re-queries in place — switching a lifecycle tab, typing a search,
 * paging a table — because the rows underneath remain the user's context.
 *
 * Two behaviours make it feel like craft rather than a widget:
 *
 * • **It reserves its own height, always.** The track renders whether or not it
 *   is active, so switching a tab never nudges the table 2px down and back. A
 *   progress indicator that causes layout shift is a net loss.
 *
 * • **It refuses to flash.** A response that lands in 60ms should show nothing
 *   at all, and a bar that appears must stay long enough to be read. That
 *   asymmetry is `useDelayedFlag`, shared with the app's nav-link spinner so
 *   every busy indicator in the product settles on the same rhythm.
 *
 * Indeterminate is expressed the ARIA way: `role="progressbar"` with no
 * `aria-valuenow`. Under `prefers-reduced-motion` the sweep is replaced by a
 * static full-width fill — the state is still announced and still visible, it
 * just doesn't travel.
 */
export interface ProgressBarProps {
  /**
   * Whether the region is currently loading. The rail decides ON ITS OWN when
   * to show and hide (see `delayMs` / `minVisibleMs`) — callers just report the
   * truth.
   */
  active: boolean;
  /**
   * How long `active` must hold before the rail appears (ms). Work that
   * finishes inside this window is invisible, which is correct: it was
   * instant. Default 120.
   */
  delayMs?: number;
  /**
   * Once shown, the minimum time the rail stays up (ms) — even if the work
   * already finished. Default 320.
   */
  minVisibleMs?: number;
  /** Announced label for the busy state. Default "Loading". */
  label?: string;
  className?: string;
}

/** Width of the travelling segment, as a fraction of the track. */
const SEGMENT_CLASS = 'w-1/3';

export function ProgressBar({
  active,
  delayMs = 120,
  minVisibleMs = 320,
  label = 'Loading',
  className,
}: ProgressBarProps) {
  const visible = useDelayedFlag(active, { delayMs, minVisibleMs });
  const reduceMotion = useReducedMotion();

  return (
    <div
      // The track is ALWAYS in the layout — see the note above on shift.
      className={cn('relative h-0.5 w-full overflow-hidden bg-transparent', className)}
      role="progressbar"
      // No aria-valuenow ⇒ indeterminate. aria-busy carries the on/off state so
      // assistive tech isn't told "loading" while the rail is at rest.
      aria-busy={visible}
      aria-label={label}
    >
      {visible &&
        (reduceMotion ? (
          // Reduced motion: present, not travelling.
          <span className="bg-accent absolute inset-0 block" />
        ) : (
          <motion.span
            className={cn('bg-accent rounded-pill absolute inset-y-0 left-0 block', SEGMENT_CLASS)}
            // x is a percentage of the SEGMENT's own width (a third of the
            // track), so -100% parks it just off the left edge and 300% carries
            // its left edge to the right edge — one clean pass, no pop.
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
    </div>
  );
}
