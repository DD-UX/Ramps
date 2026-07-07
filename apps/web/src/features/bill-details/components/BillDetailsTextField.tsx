'use client';

import type { BillEditFormType } from '@ramps/schemas/bills';
import { FieldInput, type FieldInputProps } from '@ramps/ui/FieldInput';
import { useFormContext, type FieldPath } from 'react-hook-form';

/**
 * A text/date field wired to a react-hook-form field by name, built on the design
 * system's `FieldInput` — the label floats *inside* the box and validation errors
 * render beneath it, so the field is a single self-contained DS unit (no external
 * label row). It reads the shared form instance from context (`FormProvider`), so
 * a section just names the field it owns — no prop-drilling of the form (SCP).
 */
export interface BillDetailsTextFieldProps extends Omit<
  FieldInputProps,
  'name' | 'defaultValue' | 'errors' | 'invalid'
> {
  name: FieldPath<BillEditFormType>;
  label: string;
  /** Coerce the value to a number on the way into the form (amount/qty fields). */
  numeric?: boolean;
}

export function BillDetailsTextField({ name, numeric, ...inputProps }: BillDetailsTextFieldProps) {
  const { register, getFieldState, formState } = useFormContext<BillEditFormType>();

  // `getFieldState` resolves the dotted path into RHF's nested error tree for us
  // (works for `line_items.0.amount_cents` etc.), so there's no hand-rolled walk.
  // FieldInput takes `error.message` (string | string[]) directly.
  const error = getFieldState(name, formState).error?.message;

  return (
    <FieldInput
      id={name}
      errors={error}
      {...register(name, numeric ? { valueAsNumber: true } : undefined)}
      {...inputProps}
    />
  );
}
