import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * IconButton — the square, label-free action used across Bill Pay's toolbars and
 * rows: download, calendar, invoice zoom, and the ubiquitous three-dot overflow
 * trigger in every table row (…/snapshots/18-overview-grouped-by-status.jpeg).
 *
 * Because it has no text, an accessible `label` is REQUIRED and wired to
 * aria-label. Variants stay quiet (ghost) by default so a toolbar of these reads
 * as controls, not buttons; `subtle` gives a limestone chip for emphasis.
 * Tokens only.
 */
export type IconButtonVariant = 'ghost' | 'subtle';
export type IconButtonSize = 'sm' | 'md';

const VARIANT_STYLE: Record<IconButtonVariant, string> = {
  ghost: 'text-hushed hover:bg-limestone hover:text-ink',
  subtle: 'bg-limestone text-ink hover:bg-bone',
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
      className={clsx(
        'inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-control-ring',
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
