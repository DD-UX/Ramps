import { clsx } from 'clsx';
import type { PropsWithChildren, ReactNode } from 'react';

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
 */
export type TooltipProps = PropsWithChildren<{
  label: ReactNode;
  className?: string;
}>;

export function Tooltip({ label, children, className }: TooltipProps) {
  return (
    <span className={clsx('group relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={clsx(
          'mb-rui-2 pointer-events-none absolute bottom-full left-1/2 z-10 -translate-x-1/2',
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
