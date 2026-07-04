import { clsx } from 'clsx';
import type { InputHTMLAttributes } from 'react';

/**
 * Checkbox — the multi-select primitive: bulk row-select in the AP table,
 * "Save as default coding for future bills", the vendor request-info modal's
 * checkbox list (docs/watch-youtube/README.md §5–7). Native input for
 * accessibility. Vetted against does-ramp-live-up §15 at 8x zoom: at rest a
 * sharp white square with a thin bone border; checked, a solid success-green
 * fill with a white tick (no border, no rounding).
 */
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const control = (
    <span className="relative inline-flex size-4 shrink-0">
      <input
        id={id}
        type="checkbox"
        className={clsx(
          'peer size-4 appearance-none rounded-square border border-control-border bg-white',
          'checked:border-positive checked:bg-positive',
          'focus:outline-none focus:ring-2 focus:ring-control-ring',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...props}
      />
      {/* Tick — shown only when the peer input is checked. */}
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="pointer-events-none absolute inset-0 hidden size-4 text-white peer-checked:block"
      >
        <path d="M4 8.5 7 11.5 12 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );

  if (!label) return control;

  return (
    <label htmlFor={id} className="inline-flex items-center gap-rui-2 text-sm font-body text-ink">
      {control}
      {label}
    </label>
  );
}
