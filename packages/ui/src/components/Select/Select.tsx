'use client';

import { Select as BaseSelect } from '@base-ui-components/react/select';
import { clsx } from 'clsx';
import { Check, ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';

/**
 * Select — the MUI-style dimension picker behind the line-item coding grid
 * (snapshot 9: "Accounting Category / Tax Code / Location / Department / Class").
 *
 * Reworked from the native `<select>` seed into a **custom listbox** on Base UI
 * headless primitives, matching the frame:
 *  - the placeholder is a **floating label** that rises to the top edge once a
 *    value is chosen (or the popup opens) — exactly like Material's outlined
 *    field;
 *  - options are **custom rows** with a check on the selected one, not native
 *    `<option>` tags (so we can render the ✳ dimension glyph, secondary text,
 *    etc.);
 *  - near-square corners, white fill, thin bone border, accent focus ring.
 *
 * Tokens only. Base UI drives focus/keyboard/positioning/portalling; we own the
 * skin. `"use client"` — it holds open/label state.
 */
export interface SelectOption {
  label: string;
  value: string;
  /** Optional leading glyph, e.g. the ✳ accounting-dimension mark from the frame. */
  glyph?: string;
}

export interface SelectProps {
  options: SelectOption[];
  /** The floating label (rises when filled). Falls back to `placeholder`. */
  label?: string;
  /** Placeholder shown centred when empty; also the label text if `label` is unset. */
  placeholder?: string;
  value?: SelectOption['value'];
  defaultValue?: SelectOption['value'];
  onValueChange?: (value: SelectOption['value'] | null) => void;
  invalid?: boolean;
  disabled?: boolean;
  name?: string;
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
  name,
  className,
}: SelectProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const [open, setOpen] = useState(false);
  // Track the current value so the floating label knows whether it should rise
  // (controlled value wins; otherwise mirror the uncontrolled default).
  const [internal, setInternal] = useState<SelectOption['value'] | null>(defaultValue ?? null);
  const current = value ?? internal;
  const hasValue = current != null && current !== '';
  const floated = hasValue || open;
  const labelText = label ?? placeholder ?? '';

  return (
    <BaseSelect.Root
      items={options}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
      onOpenChange={setOpen}
      onValueChange={(next) => {
        setInternal(next);
        onValueChange?.(next);
      }}
    >
      <div className={clsx('relative inline-flex w-full', className)}>
        {/* Floating label — rises to the top edge when the field is filled/open. */}
        {labelText ? (
          <span
            id={labelId}
            data-testid="select-label"
            data-floated={floated || undefined}
            className={clsx(
              'pointer-events-none absolute left-3 z-10 origin-left font-body transition-all duration-150',
              floated
                ? 'top-1 text-xs text-hushed'
                : 'top-1/2 -translate-y-1/2 text-sm text-control-placeholder',
            )}
          >
            {labelText}
          </span>
        ) : null}

        <BaseSelect.Trigger
          aria-labelledby={labelText ? labelId : undefined}
          aria-invalid={invalid || undefined}
          className={clsx(
            // Near-square white field with room for the floated label on top.
            'flex h-12 w-full items-center justify-between gap-2 rounded-square border bg-white text-left',
            'pr-3 pl-3 text-sm font-body text-ink',
            labelText ? 'pt-4 pb-1' : undefined,
            'outline-none focus-visible:ring-2 focus-visible:ring-control-ring',
            invalid
              ? 'border-destructive'
              : 'border-control-border data-[popup-open]:border-control-border-focus',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          <BaseSelect.Value className="truncate" />
          <BaseSelect.Icon className="shrink-0 text-hushed">
            <ChevronDown size={16} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>

        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={6} className="z-50 outline-none">
            <BaseSelect.Popup
              className={clsx(
                'max-h-72 min-w-[var(--anchor-width)] overflow-auto rounded-square border border-bone bg-white p-1',
                'shadow-popover',
                // Base UI enter/exit state hooks — a quick, GPU-friendly fade+lift.
                'origin-top transition-[opacity,transform] duration-150',
                'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
                'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
              )}
            >
              <BaseSelect.List>
                {options.map((opt) => (
                  <BaseSelect.Item
                    key={opt.value}
                    value={opt.value}
                    className={clsx(
                      'flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-sm font-body text-ink',
                      'data-[highlighted]:bg-limestone data-[selected]:font-heading outline-none select-none',
                    )}
                  >
                    {opt.glyph ? <span className="text-hushed">{opt.glyph}</span> : null}
                    <BaseSelect.ItemText className="flex-1 truncate">
                      {opt.label}
                    </BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator className="text-ink">
                      <Check size={16} />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </div>
    </BaseSelect.Root>
  );
}
