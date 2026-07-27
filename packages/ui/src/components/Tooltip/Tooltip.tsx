import type { PropsWithChildren, ReactNode } from 'react';

import { cn } from '../../lib/cn';

/**
 * Tooltip — a lightweight hover/focus label. Used for truncated table cells and
 * the "why" microcopy on regulatory fields (the draft screen explains *why* a
 * vendor state is required — docs/watch-youtube/…/findings.md). CSS-only
 * show/hide via group-hover/focus-within so it stays dependency-free and easy
 * to snapshot; ink surface, limestone text.
 *
 * Bounded: `w-max max-w-64` caps the bubble at 256px so a long label wraps to
 * multiple lines instead of running off-screen and offsetting the app view
 * (`w-max` is needed because an absolutely-positioned box would otherwise
 * shrink-wrap to its tiny trigger's width once wrapping is allowed).
 *
 * `placement` picks which edge the bubble hangs off. It exists because a
 * CSS-only tooltip is CLIPPED by any scrolling ancestor: the SideMenu's item
 * list is its own `overflow-auto` box, so a bubble above the FIRST nav item
 * would be cut off at the list's top edge. `placement="bottom"` drops it into
 * the list's own free space instead. Default stays `top` (the original
 * behaviour every existing call site relies on).
 */
export type TooltipPlacement = 'top' | 'bottom';

export type TooltipProps = PropsWithChildren<{
  label: ReactNode;
  /** Which edge of the trigger the bubble hangs off. Default `top`. */
  placement?: TooltipPlacement;
  className?: string;
}>;

/** Edge anchoring + the gap that separates the bubble from its trigger. */
const PLACEMENT_CLASS: Record<TooltipPlacement, string> = {
  top: 'bottom-full mb-rui-2',
  bottom: 'top-full mt-rui-2',
};

export function Tooltip({ label, children, placement = 'top', className }: TooltipProps) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-10 -translate-x-1/2',
          PLACEMENT_CLASS[placement],
          'max-w-64 rounded-square bg-ink px-rui-3 py-rui-1 text-xs font-body text-limestone w-max text-center whitespace-normal',
          'opacity-0 transition-opacity duration-100',
          'group-focus-within:opacity-100 group-hover:opacity-100',
        )}
      >
        {label}
      </span>
    </span>
  );
}
