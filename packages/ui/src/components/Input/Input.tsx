import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

import { cn } from '../../lib/cn';
import { DISABLED_CONTROL } from '../../lib/disabled';

/**
 * Input — the text-field primitive for the line-item / draft-review forms.
 *
 * Reworked against snapshot 9 (the line-item editor): the fields are
 * **white-filled, thin-bone-bordered and near-square** ("Office Chairs",
 * "$12,000.00"), not the tinted, softly-rounded control the seed used. Optional
 * leading/trailing adornments carry the `$` amount prefix or a unit suffix while
 * keeping the border on the input element itself.
 *
 * Token-only: white surface, bone border at rest, ink border + accent focus
 * ring on focus. `invalid` switches the border to the destructive family for
 * the field-level "required" validation the draft screen leans on.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Adornment before the field (e.g. a `$` amount prefix or a dimension icon). */
  leadingIcon?: ReactNode;
  /** Adornment after the field (e.g. a unit suffix or clear affordance). */
  trailingIcon?: ReactNode;
  /**
   * Pill shape — the table TOOLBAR treatment (snapshot 1: the "Search or
   * filter…" field is a fully rounded pill). Off by default; the form fields
   * in the frames are square.
   */
  rounded?: boolean;
  /**
   * Ref to the underlying `<input>` — so a consumer can focus/select it (e.g.
   * the top-bar search field focusing itself on ⌘K). Forwarded even when the
   * field is wrapped for adornments, so it always points at the real element.
   */
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  invalid,
  leadingIcon,
  trailingIcon,
  rounded = false,
  className,
  type,
  ref,
  ...props
}: InputProps) {
  const input = (
    <input
      ref={ref}
      type={type ?? 'text'}
      aria-invalid={invalid || undefined}
      className={cn(
        // White fill, near-square corners, thin border — the snapshot-9 field.
        // The toolbar search (snapshot 1) is the pill exception.
        'bg-white text-sm font-body text-ink w-full border',
        rounded ? 'rounded-pill' : 'rounded-square',
        'h-10 px-rui-3 py-rui-2',
        'placeholder:text-control-placeholder',
        'focus:outline-none',
        invalid
          ? 'border-destructive focus:border-destructive'
          : 'border-control-border focus:border-control-border-focus',
        // Consistent inert gray when disabled (shared across all controls).
        DISABLED_CONTROL,
        // Make room for adornments when present.
        leadingIcon ? 'pl-8' : undefined,
        trailingIcon ? 'pr-8' : undefined,
        className,
      )}
      {...props}
    />
  );

  // No adornments → return the bare input so consumers get a plain element.
  if (!leadingIcon && !trailingIcon) return input;

  return (
    <div className="relative inline-flex w-full items-center">
      {leadingIcon ? (
        <span className="left-3 text-hushed pointer-events-none absolute flex items-center">
          {leadingIcon}
        </span>
      ) : null}
      {input}
      {trailingIcon ? (
        <span className="right-3 text-hushed pointer-events-none absolute flex items-center">
          {trailingIcon}
        </span>
      ) : null}
    </div>
  );
}
