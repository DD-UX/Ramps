import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import type { ChangeEvent, SelectHTMLAttributes } from 'react';
import { useState } from 'react';

/**
 * Select — the STANDARD form select for bill-detail fields ("Payment method",
 * "Terms", …). It is a styled **native `<select>`** on purpose: standard
 * element, standard keyboard/assistive behaviour, native option list.
 *
 * The vetted skin (does-ramp-live-up §06): white fill, thin bone border,
 * sharp square corners, and the floating label — centred like a placeholder
 * when empty ("State (required)"), risen to the top edge when filled
 * ("Invoice date*" over "Dec 17, 2025").
 *
 * Rich option rows (glyphs, secondary text, search) are NOT this component's
 * job — that's the tailored `Dropdown` used by the line-item coding grid.
 * Tokens only.
 */
export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    'children' | 'value' | 'defaultValue' | 'multiple' | 'size' | 'onChange'
  > {
  options: SelectOption[];
  /** The floating label (rises when filled). Falls back to `placeholder`. */
  label?: string;
  /** Label text if `label` is unset (kept for API symmetry with Input). */
  placeholder?: string;
  value?: SelectOption['value'];
  defaultValue?: SelectOption['value'];
  onValueChange?: (value: SelectOption['value']) => void;
  invalid?: boolean;
  className?: string;
}

export function Select({
  options,
  label,
  placeholder,
  value,
  defaultValue,
  onValueChange,
  invalid,
  disabled,
  className,
  ...props
}: SelectProps) {
  // Controlled value wins; otherwise mirror the uncontrolled default so the
  // floating label knows whether it should rise.
  const [internal, setInternal] = useState<SelectOption['value']>(defaultValue ?? '');
  const current = value ?? internal;
  const hasValue = current !== '';
  const labelText = label ?? placeholder ?? '';

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    setInternal(event.target.value);
    onValueChange?.(event.target.value);
  }

  return (
    <label className={clsx('relative inline-flex w-full', className)}>
      {/* Floating label — centred as a placeholder when empty, top edge when filled. */}
      {labelText ? (
        <span
          data-testid="select-label"
          data-floated={hasValue || undefined}
          className={clsx(
            'pointer-events-none absolute left-3 z-10 origin-left font-body transition-all duration-150',
            hasValue
              ? 'top-1 text-xs text-hushed'
              : 'top-1/2 -translate-y-1/2 text-sm text-control-placeholder',
          )}
        >
          {labelText}
        </span>
      ) : null}

      <select
        value={value !== undefined ? value : undefined}
        defaultValue={value === undefined ? (defaultValue ?? '') : undefined}
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={clsx(
          // Sharp square white field with room for the floated label on top.
          'h-12 w-full cursor-pointer appearance-none rounded-square border bg-white pl-3 pr-8 text-sm font-body text-ink',
          labelText ? 'pt-4 pb-1' : undefined,
          'outline-none focus-visible:ring-2 focus-visible:ring-control-ring',
          invalid ? 'border-destructive' : 'border-control-border focus:border-control-border-focus',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
        {...props}
      >
        {/* Hidden empty option so the field can render blank under the label. */}
        <option value="" disabled hidden />
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Native selects can't render inline icons — overlay the chevron. */}
      <ChevronDown
        size={16}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-hushed"
      />
    </label>
  );
}
