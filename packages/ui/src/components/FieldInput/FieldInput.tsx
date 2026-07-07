'use client';

import type { ChangeEvent, FocusEvent, InputHTMLAttributes, Ref } from 'react';
import { useId, useState } from 'react';

import { cn } from '../../lib/cn';
import { DISABLED_CONTROL } from '../../lib/disabled';

/**
 * FieldInput — the text/date field that carries its label INSIDE the box, the
 * same floating-label mechanic as `Select` and `Dropdown` (not the bare
 * `Input`). The label sits centred like a placeholder when the field is empty
 * ("Invoice number"), then rises to the top edge when the field is filled or
 * focused, with the value shown beneath it.
 *
 * Vetted against the same frame family as Select (does-ramp-live-up §06): white
 * fill, thin bone border, sharp square corners, a floated hushed label. It's the
 * text/`<input>` twin of `Select` so a form can mix "Invoice number",
 * "Invoice date" and "State" fields and have them read as one row.
 *
 * `type="date"` is a first-class use: the bill-details "Payment date" field is
 * a native `<input type="date">`, and this gives it the DS floating-label
 * treatment for free. Native date inputs always paint their own `mm/dd/yyyy`
 * text, so the label floats on focus too (not only when a value is set) — the
 * label would otherwise collide with the native placeholder.
 *
 * Tokens only. `"use client"` — it owns the filled/focused floating state.
 */
export interface FieldInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  /** The floating label, inside the box (centred when empty, risen when filled). */
  label: string;
  /**
   * Validation error(s) shown beneath the field, one line each. Accepts either a
   * single message or a list, mirroring react-hook-form's `error.message`
   * (`string | string[]`): drop `fieldState.error?.message` in directly, or a
   * zod `flatten().fieldErrors[name]` (a `string[]`) for a full list. A non-empty
   * value also drives the invalid (destructive) styling on its own — pass
   * `invalid` explicitly only when you want the red frame without a message.
   */
  errors?: string | string[];
  invalid?: boolean;
  /**
   * Ref to the underlying `<input>` — forwarded through the label wrapper so a
   * consumer can still focus/select the real element.
   */
  ref?: Ref<HTMLInputElement>;
  className?: string;
}

/**
 * Input types that render their own visible text before a value is set (the
 * native `mm/dd/yyyy` / `--:--` placeholders). For these the label must float on
 * focus, not just when filled, or it overlaps that native text.
 */
const SELF_PLACEHOLDER_TYPES = new Set(['date', 'time', 'datetime-local', 'month', 'week']);

export function FieldInput({
  label,
  errors,
  invalid,
  disabled,
  className,
  type = 'text',
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  ref,
  id,
  'aria-describedby': ariaDescribedBy,
  ...props
}: FieldInputProps) {
  // Mirror the uncontrolled value (like Select) so the floated state is correct
  // whether the field is controlled or not.
  const [internal, setInternal] = useState<string>(
    defaultValue != null ? String(defaultValue) : '',
  );
  const [focused, setFocused] = useState(false);

  const current = value != null ? String(value) : internal;
  const hasValue = current !== '';
  const selfPlaceholder = SELF_PLACEHOLDER_TYPES.has(type);
  // Native date/time inputs paint their own placeholder, so float on focus too.
  const floatOnFocus = selfPlaceholder && focused;
  const floated = hasValue || floatOnFocus;

  // Normalise the string | string[] error prop to a clean list; a non-empty
  // result turns the field destructive on its own, while an explicit `invalid`
  // still forces the red frame without needing a message.
  const errorList = (Array.isArray(errors) ? errors : errors != null ? [errors] : []).filter(
    (message) => message.trim() !== '',
  );
  const hasErrors = errorList.length > 0;
  const isInvalid = invalid || hasErrors;

  // Wire the errors to the input for AT: a stable id per field, then
  // `aria-describedby` on the input and a matching id on the error group. Any
  // caller-supplied `aria-describedby` is preserved alongside it.
  const reactId = useId();
  const errorId = `${id ?? reactId}-error`;
  const describedBy = cn(ariaDescribedBy, hasErrors && errorId) || undefined;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (value == null) setInternal(event.target.value);
    onChange?.(event);
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setFocused(true);
    onFocus?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setFocused(false);
    onBlur?.(event);
  }

  return (
    // Column: the label+input row, then the error group beneath it. The <label>
    // still wraps the input so clicking the frame focuses it.
    <div className={cn('gap-rui-1 flex w-full flex-col', className)}>
      <label className="relative inline-flex w-full">
        {/* Floating label — centred as a placeholder when empty, top edge when filled. */}
        <span
          data-testid="field-input-label"
          data-floated={floated || undefined}
          className={cn(
            'left-3 font-body pointer-events-none absolute z-10 origin-left transition-all duration-150',
            floated
              ? 'top-1 text-xs text-hushed'
              : 'text-sm text-control-placeholder top-1/2 -translate-y-1/2',
          )}
        >
          {label}
        </span>

        <input
          ref={ref}
          id={id}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          aria-invalid={isInvalid || undefined}
          aria-label={label}
          aria-describedby={describedBy}
          className={cn(
            // Sharp square white field with room for the floated label on top —
            // matched to Select so the two read as one row.
            'h-12 rounded-square bg-white px-3 text-sm font-body text-ink w-full border',
            'pt-4 pb-1',
            // Hide the native placeholder text until the label has floated, so it
            // doesn't sit under the centred label (mainly the date mm/dd/yyyy).
            floated ? undefined : 'text-transparent',
            // Native date/time picker glyph (::-webkit-calendar-picker-indicator)
            // otherwise sits at the bottom because of the top padding that makes
            // room for the floated label. Lift it out of the padding flow and
            // centre it against the full field height, like Select's chevron.
            selfPlaceholder &&
              '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer',
            'focus:ring-control-ring focus:ring-2 focus:outline-none',
            isInvalid
              ? 'border-destructive focus:border-destructive'
              : 'border-control-border focus:border-control-border-focus',
            // Consistent inert gray when disabled (shared across all controls).
            DISABLED_CONTROL,
          )}
          {...props}
        />
      </label>

      {/* Error group — one line per message, announced together via role="alert". */}
      {hasErrors && (
        <div
          id={errorId}
          role="alert"
          data-testid="field-input-errors"
          className="text-xs font-body text-destructive gap-rui-1 flex flex-col"
        >
          {errorList.map((message, index) => (
            <span key={`${message}-${index}`}>{message}</span>
          ))}
        </div>
      )}
    </div>
  );
}
