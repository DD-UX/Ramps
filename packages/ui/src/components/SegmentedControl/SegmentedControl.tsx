'use client';

import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { type ReactNode,useId } from 'react';

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
 * The white plate is ONE Motion `layoutId` element that glides between
 * segments when the selection moves (same shared-layout trick as the Tabs
 * underline) — so the background is literally *shared* across options, never
 * two plates mid-flight. Works for 2..n options: the grid splits evenly.
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
  // The shared-layout id must be unique PER INSTANCE — two controls on one
  // screen would otherwise fight over the same plate and fly across the page.
  const layoutId = useId();

  return (
    <div
      role="tablist"
      className={clsx(
        'grid auto-cols-fr grid-flow-col rounded-square border border-bone bg-stone',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange?.(option.value)}
            className="relative cursor-pointer px-rui-4 py-rui-2 text-sm font-heading text-ink"
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                data-testid="segment-plate"
                // The plate paints UNDER the label (label is z-10) and draws
                // the selected segment's darker hairline over the stone strip.
                className="absolute inset-0 rounded-square border border-hushed bg-white"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
