'use client';

import { animate, motion } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { cn } from '../../lib/cn';
import { TAP } from '../motion/pressVariants';

/**
 * Tabs — the lifecycle shell navigation: Overview · Drafts · For approval ·
 * For payment · History (docs/watch-youtube/README.md §1).
 *
 * Reworked to the Ramp bar: a **single** underline indicator slides between
 * tabs, so exactly one indicator exists in the DOM at a time
 * (`data-testid="tab-underline"`).
 *
 * The glide is an X-TRANSFORM of one bar-owned element — deliberately NOT a
 * Motion shared-layout (`layoutId`) hop. A layout animation replays every
 * layout delta, so when content above the bar grows and the whole bar shifts
 * down, the underline would visibly glide back to its own tab. Instead the
 * bar measures the active tab (`offsetLeft`/`offsetWidth` — tabs are
 * variable-width, so this can't be a fraction like SegmentedControl's plate)
 * and springs `x`/`width` ONLY on selection change; mount and resizes SNAP
 * into place with no travel, and any page reflow carries the pinned underline
 * instantly.
 *
 * Controlled: the parent owns the active value (it maps to a route segment in
 * the app). An optional per-tab `count` renders the "N" badge the For-approval
 * tab shows. `"use client"` — Motion animates on the client.
 */
export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onValueChange, className }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);

  // Position the bar-owned underline under the selected tab. `animateMove`
  // decides spring vs. snap: springs are for SELECTION changes only — mount,
  // tab-set changes and resizes must land instantly, or the underline would
  // travel on events the user didn't cause. Imperative styles/`animate` (not
  // state) so measurement in a layout effect never re-renders.
  const place = useCallback((animateMove: boolean) => {
    const list = listRef.current;
    const underline = underlineRef.current;
    if (!list || !underline) return;
    const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!active) {
      underline.style.opacity = '0';
      return;
    }
    underline.style.opacity = '1';
    const target = { x: active.offsetLeft, width: active.offsetWidth };
    if (animateMove) {
      animate(underline, target, { type: 'spring', stiffness: 500, damping: 40 });
    } else {
      underline.style.transform = `translateX(${target.x}px)`;
      underline.style.width = `${target.width}px`;
    }
  }, []);

  // First paint SNAPS the underline into place (no fly-in); every later
  // `value`/`tabs` change glides it.
  const firstPaint = useRef(true);
  useLayoutEffect(() => {
    place(!firstPaint.current);
    firstPaint.current = false;
  }, [place, value, tabs]);

  // Tabs are variable-width, so a bar resize (font load, container squeeze)
  // re-measures — and snaps, because nothing was "selected". Guarded: jsdom
  // (and any non-observing runtime) simply keeps the mount-time placement.
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => place(false));
    observer.observe(list);
    return () => observer.disconnect();
  }, [place]);

  return (
    <div
      ref={listRef}
      role="tablist"
      className={cn('gap-rui-4 border-bone relative flex items-center border-b', className)}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <motion.button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange?.(tab.value)}
            // Press-only feel (TAP): a quiet squash under the finger, NO hover
            // lift — the tab's hover language is the colour shift + the gliding
            // underline, which a scale-on-hover would fight. The underline lives
            // on the BAR, not in the button, so the squash never distorts it.
            {...TAP}
            className={cn(
              'gap-rui-2 px-rui-1 py-rui-3 text-sm font-heading relative -mb-px inline-flex cursor-pointer items-center',
              active ? 'text-ink' : 'text-hushed hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <motion.span
                // The count pops in with a spring when it first appears (a bill
                // lands in "For approval"), then settles — a small "something
                // changed here" cue, not a loop.
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                className={cn(
                  'rounded-pill px-rui-2 text-xs font-body',
                  active ? 'bg-ink text-limestone' : 'bg-limestone text-hushed',
                )}
              >
                {tab.count}
              </motion.span>
            )}
          </motion.button>
        );
      })}
      {/* The single bar-owned underline. Starts transparent so the pre-measure
          frame never flashes it at x=0; `place` reveals and positions it. */}
      <span
        ref={underlineRef}
        data-testid="tab-underline"
        className="rounded-pill bg-ink absolute -bottom-px left-0 h-0.5 opacity-0"
      />
    </div>
  );
}
