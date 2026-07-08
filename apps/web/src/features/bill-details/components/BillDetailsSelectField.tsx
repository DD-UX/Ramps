'use client';

import type { BillEditFormType } from '@ramps/schemas/bills';
import { Select, type SelectOption } from '@ramps/ui/Select';
import { Controller, type FieldPath, useFormContext } from 'react-hook-form';

/**
 * A `Select` bound to a react-hook-form field by name. Like {@link BillDetailsTextField}
 * it's a self-contained DS unit: `Select` owns its floating label (inside the box),
 * so there's no external label row — matching the `FieldInput`-based text fields.
 * `Select` has no error slot of its own, so the field renders the validation line
 * beneath it here.
 *
 * The UI `Select` speaks `onValueChange(string)` rather than a native change event,
 * so we bridge it through a `Controller`. An empty string maps to `null` on the way
 * in/out so a nullable id column (an unpicked GL account, department, …) round-trips
 * cleanly.
 */
export interface BillDetailsSelectFieldProps {
  name: FieldPath<BillEditFormType>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
}

export function BillDetailsSelectField({
  name,
  label,
  options,
  placeholder,
}: BillDetailsSelectFieldProps) {
  const { control } = useFormContext<BillEditFormType>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const error = fieldState.error?.message;
        return (
          <div className="gap-rui-1 flex w-full flex-col">
            <Select
              options={options}
              label={label}
              placeholder={placeholder ?? label}
              invalid={Boolean(error)}
              value={field.value == null ? '' : String(field.value)}
              onValueChange={(value) => field.onChange(value === '' ? null : value)}
            />
            {error && (
              <p role="alert" className="text-xs font-body text-destructive">
                {error}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
