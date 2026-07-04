'use client';

import { clsx } from 'clsx';
import { motion } from 'motion/react';

/**
 * Tabs — the lifecycle shell navigation: Overview · Drafts · For approval ·
 * For payment · History (docs/watch-youtube/README.md §1).
 *
 * Reworked to the Ramp bar: a **single** underline indicator slides between tabs
 * via Motion's shared layout (`layoutId`) instead of each tab drawing its own
 * `border-b`. That gives the smooth left↔right glide you see when switching
 * lifecycle stages, and means exactly one indicator exists in the DOM at a time
 * (`data-testid="tab-underline"`).
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
  return (
    <div
      role="tablist"
      className={clsx('flex items-center gap-rui-4 border-b border-bone', className)}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange?.(tab.value)}
            className={clsx(
              'relative -mb-px inline-flex cursor-pointer items-center gap-rui-2 px-rui-1 py-rui-3 text-sm font-heading',
              active ? 'text-ink' : 'text-hushed hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'rounded-pill px-rui-2 text-xs font-body',
                  active ? 'bg-ink text-limestone' : 'bg-limestone text-hushed',
                )}
              >
                {tab.count}
              </span>
            )}
            {active && (
              <motion.span
                layoutId="tab-underline"
                data-testid="tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-pill bg-ink"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
