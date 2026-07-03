import { clsx } from 'clsx';
import type { InputHTMLAttributes } from 'react';

/**
 * Input — the text-field primitive for the draft-review form (invoice number,
 * amount, dates, vendor fields). Token-only: bone border at rest, ink border +
 * accent focus ring on focus. An `invalid` flag switches the border to the
 * destructive family for the field-level "required" validation the draft screen
 * leans on (docs/watch-youtube/…/findings.md — the red missing-info banner).
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className, type, ...props }: InputProps) {
  return (
    <input
      type={type ?? 'text'}
      aria-invalid={invalid || undefined}
      className={clsx(
        'w-full rounded-control border bg-limestone px-rui-3 py-rui-2 text-sm font-body text-ink',
        'placeholder:text-control-placeholder',
        'focus:outline-none focus:ring-2 focus:ring-control-ring',
        invalid
          ? 'border-destructive focus:border-destructive'
          : 'border-control-border focus:border-control-border-focus',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}
