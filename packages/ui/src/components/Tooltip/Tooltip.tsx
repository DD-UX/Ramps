import { clsx } from 'clsx';
import type { PropsWithChildren, ReactNode } from 'react';

/**
 * Tooltip — a lightweight hover/focus label. Used for truncated table cells and
 * the "why" microcopy on regulatory fields (the draft screen explains *why* a
 * vendor state is required — docs/watch-youtube/…/findings.md). CSS-only
 * show/hide via group-hover/focus-within so it stays dependency-free and easy
 * to snapshot; ink surface, limestone text.
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
          'pointer-events-none absolute bottom-full left-1/2 z-10 mb-rui-2 -translate-x-1/2',
          'whitespace-nowrap rounded-square bg-ink px-rui-3 py-rui-1 text-xs font-body text-limestone',
          'opacity-0 transition-opacity duration-100',
          'group-hover:opacity-100 group-focus-within:opacity-100',
        )}
      >
        {label}
      </span>
    </span>
  );
}
