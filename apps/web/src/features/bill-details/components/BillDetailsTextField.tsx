'use client';

import type { BillEditFormType } from '@ramps/schemas/bills';
import { Input, type InputProps } from '@ramps/ui/Input';
import { useFormContext, type FieldPath } from 'react-hook-form';

import { BillDetailsFormField } from './BillDetailsFormField';

/**
 * A text/date `Input` wired to a react-hook-form field by name. Reads the shared
 * form instance from context (`FormProvider`), so a section just names the field
 * it owns — no prop-drilling of the form (SCP). The label, the "(required)"
 * hint, and the field-level error line all come from {@link BillDetailsFormField}.
 */
export interface BillDetailsTextFieldProps extends Omit<InputProps, 'name' | 'defaultValue'> {
  name: FieldPath<BillEditFormType>;
  label: string;
  required?: boolean;
  /** Coerce the value to a number on the way into the form (amount/qty fields). */
  numeric?: boolean;
}

export function BillDetailsTextField({
  name,
  label,
  required,
  numeric,
  ...inputProps
}: BillDetailsTextFieldProps) {
  const { register, getFieldState, formState } = useFormContext<BillEditFormType>();

  // `getFieldState` resolves the dotted path into RHF's nested error tree for us
  // (works for `line_items.0.amount_cents` etc.), so there's no hand-rolled walk.
  const error = getFieldState(name, formState).error?.message;

  return (
    <BillDetailsFormField label={label} required={required} error={error} htmlFor={name}>
      <Input
        id={name}
        invalid={Boolean(error)}
        {...register(name, numeric ? { valueAsNumber: true } : undefined)}
        {...inputProps}
      />
    </BillDetailsFormField>
  );
}
