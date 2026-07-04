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
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
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
        'inline-flex items-center justify-center rounded-square transition-colors focus:outline-none focus:ring-2 focus:ring-control-ring disabled:opacity-40',
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
