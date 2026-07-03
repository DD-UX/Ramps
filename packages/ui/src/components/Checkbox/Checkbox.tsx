import { clsx } from 'clsx';
import type { InputHTMLAttributes } from 'react';

/**
 * Checkbox — the multi-select primitive: bulk row-select in the AP table,
 * "Save as default coding for future bills", the vendor request-info modal's
 * checkbox list (docs/watch-youtube/README.md §5–7). Native input for
 * accessibility; the checked state paints the accent lime with an ink tick.
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
          'peer size-4 appearance-none rounded-[3px] border border-control-border bg-limestone',
          'checked:border-ink checked:bg-accent',
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
        className="pointer-events-none absolute inset-0 hidden size-4 text-ink peer-checked:block"
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
