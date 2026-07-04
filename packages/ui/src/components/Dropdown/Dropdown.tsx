'use client';

import { Combobox } from '@base-ui-components/react/combobox';
import { clsx } from 'clsx';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Dropdown — the TAILORED option picker behind the line-item coding grid and
 * the 1099 box mapping. This is deliberately NOT the standard `Select`:
 * its whole point is fully customizable option rows.
 *
 * Vetted against the frames (ramp-bill-pay-series-1099-s §07/08,
 * ramp-bill-pay-product-overview §07):
 *  - trigger: sharp square white cell — optional leading glyph (⚡), the
 *    selected title with its secondary line under it ("Box 1"), a clear ×
 *    and the chevron;
 *  - popup: square white card with a **search input** at the top
 *    ("Search…" + magnifier), **group headers** ("1099-NEC", "1099-MISC"),
 *    rich rows (title + hushed secondary line), a **check** on the selected
 *    row, and an optional pinned footer row ("Not reportable") separated
 *    from the list.
 *
 * Base UI Combobox drives focus/keyboard/filtering/portalling; we own the
 * skin. `renderOption` is the escape hatch when even the built-in row parts
 * aren't enough. Tokens only. `"use client"` — interactive popup state.
 */
export interface DropdownOption {
  value: string;
  label: string;
  /** Secondary line under the title (e.g. the 1099 "Box 1"). */
  description?: string;
  /** Leading glyph — Lucide icon, ⚡ dimension mark, vendor logo… */
  glyph?: ReactNode;
  /** Trailing meta on the row's right edge (count, code, shortcut…). */
  meta?: ReactNode;
  disabled?: boolean;
}

/** A labelled section of options ("1099-NEC", "1099-MISC"). */
export interface DropdownGroup {
  label: string;
  options: DropdownOption[];
}

export interface DropdownProps {
  /** Flat option list. Ignored when `groups` is provided. */
  options?: DropdownOption[];
  /** Grouped options with section headers. Takes precedence over `options`. */
  groups?: DropdownGroup[];
  placeholder?: string;
  /** Placeholder of the in-popup search input (frame 08 shows "Search..."). */
  searchPlaceholder?: string;
  value?: DropdownOption['value'] | null;
  defaultValue?: DropdownOption['value'] | null;
  onValueChange?: (value: DropdownOption['value'] | null) => void;
  /** Shows the little × that clears the selection (frame 07). */
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** Pinned row below the list, visually separated ("Not reportable"). */
  footer?: ReactNode;
  /** Full custom row renderer — overrides the glyph/label/description layout. */
  renderOption?: (option: DropdownOption) => ReactNode;
  className?: string;
}

/** Internal Base UI `items` shape for grouped lists. */
interface GroupItems {
  value: string;
  items: DropdownOption[];
}

const TRIGGER_CONTENT_STYLE = 'flex min-w-0 flex-1 items-center gap-2 text-left';

function OptionRow({
  option,
  renderOption,
}: {
  option: DropdownOption;
  renderOption?: DropdownProps['renderOption'];
}) {
  return (
    <Combobox.Item
      value={option}
      disabled={option.disabled}
      data-testid="dropdown-option"
      className={clsx(
        'flex cursor-pointer items-center gap-2 rounded-square px-2 py-1.5 outline-none select-none',
        'data-[highlighted]:bg-limestone data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
      )}
    >
      {renderOption ? (
        renderOption(option)
      ) : (
        <>
          {option.glyph ? (
            <span aria-hidden className="shrink-0 text-hushed">
              {option.glyph}
            </span>
          ) : null}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-body text-ink">{option.label}</span>
            {option.description ? (
              <span className="block truncate text-xs font-body text-hushed">
                {option.description}
              </span>
            ) : null}
          </span>
          {option.meta ? (
            <span className="shrink-0 text-xs font-body text-hushed">{option.meta}</span>
          ) : null}
          <Combobox.ItemIndicator className="shrink-0 text-ink">
            <Check size={16} />
          </Combobox.ItemIndicator>
        </>
      )}
    </Combobox.Item>
  );
}

export function Dropdown({
  options,
  groups,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  value,
  defaultValue,
  onValueChange,
  clearable = false,
  disabled,
  invalid,
  footer,
  renderOption,
  className,
}: DropdownProps) {
  const flat: DropdownOption[] = groups ? groups.flatMap((g) => g.options) : (options ?? []);
  const items: DropdownOption[] | GroupItems[] = groups
    ? groups.map((g) => ({ value: g.label, items: g.options }))
    : flat;

  const byValue = (v: DropdownOption['value'] | null | undefined) =>
    v == null ? null : (flat.find((opt) => opt.value === v) ?? null);

  return (
    <Combobox.Root
      items={items}
      // Base UI types single-mode `value` without null, but null is its own
      // runtime "no selection" (onValueChange emits it) — narrow the type only.
      value={value !== undefined ? (byValue(value) as DropdownOption | undefined) : undefined}
      defaultValue={defaultValue !== undefined ? byValue(defaultValue) : undefined}
      isItemEqualToValue={(a: DropdownOption, b: DropdownOption) => a?.value === b?.value}
      disabled={disabled}
      onValueChange={(next: DropdownOption | null) => {
        onValueChange?.(next?.value ?? null);
      }}
    >
      <div className={clsx('relative inline-flex w-full items-center', className)}>
        <Combobox.Trigger
          aria-invalid={invalid || undefined}
          className={clsx(
            // The sharp square coding cell from the line-item grid.
            'flex h-12 w-full cursor-pointer items-center gap-2 rounded-square border bg-white px-3 text-left',
            'text-sm font-body text-ink outline-none',
            'focus-visible:ring-2 focus-visible:ring-control-ring',
            invalid
              ? 'border-destructive'
              : 'border-control-border data-[popup-open]:border-control-border-focus',
            'disabled:cursor-not-allowed disabled:opacity-60',
            clearable ? 'pr-14' : 'pr-8',
          )}
        >
          <Combobox.Value>
            {(selected: DropdownOption | null) =>
              selected ? (
                <span className={TRIGGER_CONTENT_STYLE}>
                  {selected.glyph ? (
                    <span aria-hidden className="shrink-0 text-hushed">
                      {selected.glyph}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{selected.label}</span>
                    {selected.description ? (
                      <span className="block truncate text-xs text-hushed">
                        {selected.description}
                      </span>
                    ) : null}
                  </span>
                </span>
              ) : (
                <span className="flex-1 truncate text-control-placeholder">{placeholder}</span>
              )
            }
          </Combobox.Value>
        </Combobox.Trigger>

        {/* Trailing affordances overlay the trigger's right edge (frame 07: × then ⌄). */}
        {clearable ? (
          <Combobox.Clear
            aria-label="Clear selection"
            className="absolute right-8 cursor-pointer rounded-square p-0.5 text-hushed outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-control-ring"
          >
            <X size={14} />
          </Combobox.Clear>
        ) : null}
        <ChevronDown
          size={16}
          aria-hidden
          className="pointer-events-none absolute right-3 text-hushed"
        />
      </div>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} className="z-50 outline-none">
          <Combobox.Popup
            data-testid="dropdown"
            className={clsx(
              'flex max-h-80 w-[var(--anchor-width)] min-w-56 flex-col rounded-square border border-bone bg-white',
              'shadow-popover',
              'origin-top transition-[opacity,transform] duration-150',
              'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
              'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            )}
          >
            {/* Search row — input left, magnifier right (frame 08). */}
            <div className="relative border-b border-bone">
              <Combobox.Input
                placeholder={searchPlaceholder}
                className="h-9 w-full bg-transparent pr-8 pl-3 text-sm font-body text-ink outline-none placeholder:text-control-placeholder"
              />
              <Search
                size={14}
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-hushed"
              />
            </div>

            <Combobox.Empty className="px-3 py-2 text-sm font-body text-hushed">
              No results
            </Combobox.Empty>

            <Combobox.List className="flex-1 overflow-auto p-1">
              {groups
                ? (group: GroupItems) => (
                    <Combobox.Group key={group.value} items={group.items}>
                      <Combobox.GroupLabel className="px-2 pt-2 pb-1 text-xs font-body text-hushed">
                        {group.value}
                      </Combobox.GroupLabel>
                      <Combobox.Collection>
                        {(option: DropdownOption) => (
                          <OptionRow
                            key={option.value}
                            option={option}
                            renderOption={renderOption}
                          />
                        )}
                      </Combobox.Collection>
                    </Combobox.Group>
                  )
                : (option: DropdownOption) => (
                    <OptionRow key={option.value} option={option} renderOption={renderOption} />
                  )}
            </Combobox.List>

            {/* Pinned, separated footer row ("Not reportable" — frame 07). */}
            {footer ? (
              <div className="border-t border-bone px-3 py-2 text-sm font-body text-ink">
                {footer}
              </div>
            ) : null}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
