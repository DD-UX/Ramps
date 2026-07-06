import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/cn';

/**
 * IconButton — the square, label-free action used across Bill Pay's toolbars and
 * rows: download, calendar, invoice zoom, and the ubiquitous three-dot overflow
 * trigger in every table row (…/snapshots/18-overview-grouped-by-status.jpeg).
 *
 * Because it has no text, an accessible `label` is REQUIRED and wired to
 * aria-label. Variants stay quiet (ghost) by default so a toolbar of these reads
 * as controls, not buttons; `subtle` gives a limestone chip for emphasis, and
 * `outline` is the white + bone-border treatment (the calendar/export circles in
 * the Bill Pay toolbar, …/snapshots/04) — the icon-only twin of Button's
 * `secondary`. Tokens only.
 */
export type IconButtonVariant = 'ghost' | 'subtle' | 'outline';
export type IconButtonSize = 'sm' | 'md';

const VARIANT_STYLE: Record<IconButtonVariant, string> = {
  ghost: 'text-hushed hover:bg-limestone hover:text-ink',
  subtle: 'bg-limestone text-ink hover:bg-bone',
  outline: 'bg-white text-ink border border-bone hover:bg-limestone',
};

const SIZE_STYLE: Record<IconButtonSize, string> = {
  sm: 'size-7',
  md: 'size-9',
};

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible name — required (no visible text). */
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /**
   * Pill shape — same contract as Button's `rounded` (the frame-1 toolbar
   * treatment). Off by default; the frames show square everywhere else.
   */
  rounded?: boolean;
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  rounded = false,
  className,
  type,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      aria-label={label}
      title={label}
      className={cn(
        'focus:ring-control-ring inline-flex shrink-0 items-center justify-center transition-colors focus:ring-2 focus:outline-none',
        rounded ? 'rounded-pill' : 'rounded-square',
        // Interactive affordance: pointer when enabled, dimmed + not-allowed when disabled.
        'cursor-pointer disabled:cursor-not-allowed disabled:opacity-40',
        VARIANT_STYLE[variant],
        SIZE_STYLE[size],
        className,
      )}
      {...props}
    >
      <span aria-hidden>{icon}</span>
    </button>
  );
}
