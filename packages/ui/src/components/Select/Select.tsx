import { clsx } from 'clsx';
import type { SelectHTMLAttributes } from 'react';

/**
 * Select — the dropdown primitive behind the line-item coding grid: the
 * "{Provider} Category / Department / Class / Location" dimension pickers
 * (docs/watch-youtube/README.md §3). Options are synced reference records, not
 * free text — this control just renders them. Native <select> for accessibility
 * and testability; styled to the token system with a custom chevron.
 */
export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
}

export function Select({ options, placeholder, invalid, className, ...props }: SelectProps) {
  return (
    <div className="relative inline-flex w-full">
      <select
        aria-invalid={invalid || undefined}
        className={clsx(
          'w-full appearance-none rounded-control border bg-limestone py-rui-2 pr-rui-4 pl-rui-3 text-sm font-body text-ink',
          'focus:outline-none focus:ring-2 focus:ring-control-ring',
          invalid
            ? 'border-destructive focus:border-destructive'
            : 'border-control-border focus:border-control-border-focus',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        defaultValue={placeholder ? '' : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {/* Chevron — pointer-events off so it never eats the click. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-rui-2 flex items-center text-hushed"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}
