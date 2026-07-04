import { clsx } from 'clsx';

/**
 * Spinner — the indeterminate loading indicator for in-flight actions (file
 * upload, payment processing, sync). Ramp prefers skeletons for content, so the
 * spinner is reserved for buttons and small inline "working…" states.
 *
 * A token-tinted ring using border colours + Tailwind's animate-spin; `currentColor`
 * on the leading arc so it inherits the surrounding text tone (e.g. ink on a
 * limestone button, limestone on an ink button).
 */
export type SpinnerSize = 'sm' | 'md';

const SIZE_STYLE: Record<SpinnerSize, string> = {
  sm: 'size-3.5 border-2',
  md: 'size-5 border-2',
};

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  /** Accessible label for standalone use; omit when decorative inside a labelled control. */
  label?: string;
}

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={clsx(
        'inline-block animate-spin rounded-pill border-current/25 border-t-current',
        SIZE_STYLE[size],
        className,
      )}
    />
  );
}
