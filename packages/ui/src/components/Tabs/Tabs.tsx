'use client';

import { motion } from 'motion/react';
import { useId } from 'react';

import { cn } from '../../lib/cn';

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
  // Scope the shared-layout underline to THIS bar. `layoutId` is a global key in
  // Motion, so two Tabs on one page that both used a fixed "tab-underline" would
  // share one indicator and cross-animate — the underline would fly from one bar
  // to the other. A per-instance id keeps each bar's glide to itself.
  const underlineId = useId();
  return (
    <div
      role="tablist"
      className={cn('gap-rui-4 border-bone flex items-center border-b', className)}
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
            className={cn(
              'gap-rui-2 px-rui-1 py-rui-3 text-sm font-heading relative -mb-px inline-flex cursor-pointer items-center',
              active ? 'text-ink' : 'text-hushed hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-pill px-rui-2 text-xs font-body',
                  active ? 'bg-ink text-limestone' : 'bg-limestone text-hushed',
                )}
              >
                {tab.count}
              </span>
            )}
            {active && (
              <motion.span
                layoutId={underlineId}
                data-testid="tab-underline"
                className="inset-x-0 h-0.5 rounded-pill bg-ink absolute -bottom-px"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
