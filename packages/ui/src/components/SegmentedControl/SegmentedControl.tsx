'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';
import { TAP } from '../motion/pressVariants';

/**
 * SegmentedControl — the `[ New card | Existing card ]` switch on the
 * pay-by-card panel (product-overview snapshot 12).
 *
 * Vetted from the frame at 3x zoom + 1px sampling: a full-width strip of
 * EQUAL segments with sharp corners; the resting segments sit on the stone
 * gray (#e6e4e3 sampled ≈ `--rui-stone`), the selected one is a white plate
 * with a dark hairline (1px border blurred to ~#9e9e9e in the JPEG — the
 * hushed gray, clearly darker than the bone container hairline). Labels are
 * ink on BOTH sides.
 *
 * The white plate is ONE element owned by the strip, moved between segments
 * by animating its `x` TRANSFORM alone — deliberately NOT a shared-layout
 * `layoutId` element. A layout animation replays every layout delta, so when
 * content above the control grows and the whole strip shifts down, the plate
 * would visibly glide to catch up with its own control. Transform-positioned,
 * the plate is pinned inside the strip and rides any reflow instantly; the
 * only thing that ever animates is the horizontal hop between segments.
 * Works for 2..n options: the grid splits evenly, so the plate is `1/n` wide
 * and each hop is one plate-width (`x: index * 100%`).
 *
 * Controlled: the parent owns `value`. Tab semantics (`tablist`/`tab`) so it
 * can front a panel — {@link SegmentedArea} builds exactly that on top.
 */
export interface SegmentedControlOption {
  value: string;
  label: ReactNode;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onValueChange,
  className,
}: SegmentedControlProps) {
  const activeIndex = options.findIndex((option) => option.value === value);

  return (
    <div
      role="tablist"
      className={cn(
        'rounded-square border-bone bg-stone relative grid auto-cols-fr grid-flow-col border',
        className,
      )}
    >
      {/* The gliding white plate — one strip-owned element, 1/n of the strip
          wide, X-transformed to the active segment. `x` percentages resolve
          against the PLATE's own width, so `index * 100%` lands each hop on a
          segment boundary. `initial={false}` mounts it in place (no fly-in);
          being transform-driven (not a layout animation), a page reflow that
          moves the strip carries the plate with zero animation — see the
          docblock. */}
      {activeIndex >= 0 && (
        <motion.span
          data-testid="segment-plate"
          // The plate paints UNDER the labels (labels are z-10) and draws
          // the selected segment's darker hairline over the stone strip.
          className="rounded-square border-hushed bg-white absolute inset-y-0 left-0 border"
          style={{ width: `${100 / options.length}%` }}
          initial={false}
          animate={{ x: `${activeIndex * 100}%` }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      {options.map((option) => {
        const active = option.value === value;
        return (
          <motion.button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange?.(option.value)}
            // Press-only feel (TAP): a quiet squash under the finger, no hover
            // lift — the segment's own language is the gliding white plate, so
            // hover-scaling would fight it.
            {...TAP}
            className="px-rui-4 py-rui-2 text-sm font-heading text-ink relative cursor-pointer"
          >
            <span className="relative z-10">{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
