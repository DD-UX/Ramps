import type { InputHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

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
    <span className="size-4 relative inline-flex shrink-0">
      <input
        id={id}
        type="checkbox"
        className={cn(
          'peer size-4 rounded-square border-control-border bg-white cursor-pointer appearance-none border',
          'checked:border-positive checked:bg-positive',
          'focus:border-control-border-focus focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...props}
      />
      {/* Tick — shown only when the peer input is checked. */}
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="inset-0 size-4 text-white pointer-events-none absolute hidden peer-checked:block"
      >
        <path
          d="M4 8.5 7 11.5 12 5"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );

  if (!label) return control;

  return (
    <label
      htmlFor={id}
      // The WHOLE label is the hit area: pointer when enabled, and when the
      // input is disabled the not-allowed cursor covers the label text too —
      // clicking "Tax details (W-9)" must feel as inert as the box itself.
      className="gap-rui-2 text-sm font-body text-ink inline-flex cursor-pointer items-center has-[input:disabled]:cursor-not-allowed"
    >
      {control}
      {label}
    </label>
  );
}
