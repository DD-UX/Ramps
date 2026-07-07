'use client';

import type { BillEditFormType } from '@ramps/schemas/bills';
import { Select, type SelectOption } from '@ramps/ui/Select';
import { Controller, useFormContext, type FieldPath } from 'react-hook-form';

import { BillDetailsFormField } from './BillDetailsFormField';

/**
 * A `Select` bound to a react-hook-form field by name. The UI `Select` speaks
 * `onValueChange(string)` rather than a native change event, so we bridge it
 * through a `Controller`. An empty string maps to `null` on the way in/out so a
 * nullable id column (an unpicked GL account, department, …) round-trips
 * cleanly.
 */
export interface BillDetailsSelectFieldProps {
  name: FieldPath<BillEditFormType>;
  label: string;
  options: SelectOption[];
  required?: boolean;
  placeholder?: string;
}

export function BillDetailsSelectField({
  name,
  label,
  options,
  required,
  placeholder,
}: BillDetailsSelectFieldProps) {
  const { control } = useFormContext<BillEditFormType>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <BillDetailsFormField
          label={label}
          required={required}
          error={fieldState.error?.message}
          htmlFor={name}
        >
          <Select
            options={options}
            placeholder={placeholder ?? label}
            value={field.value == null ? '' : String(field.value)}
            onValueChange={(value) => field.onChange(value === '' ? null : value)}
          />
        </BillDetailsFormField>
      )}
    />
  );
}
