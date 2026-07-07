import type { ReactNode } from 'react';

/**
 * BillDetailsFormField — the label + control + optional required/error line every draft
 * field shares (snapshots 6–7: "State (required)", "Contact email (required)").
 * Pure layout so each section stays a flat list of fields at one rhythm.
 */
export interface BillDetailsFormFieldProps {
  label: string;
  /** Renders the amber "(required)" hint the draft screen shows on empty fields. */
  required?: boolean;
  /** Field-level validation message (from react-hook-form). */
  error?: string;
  htmlFor?: string;
  // Required + never storied (apps/web): explicit `children` over PropsWithChildren
  // is deliberate — a field wrapping no control is a compile error, not a no-op.
  children: ReactNode;
}

export function BillDetailsFormField({
  label,
  required,
  error,
  htmlFor,
  children,
}: BillDetailsFormFieldProps) {
  return (
    <div className="gap-rui-1 flex flex-col">
      <label htmlFor={htmlFor} className="text-xs font-heading text-hushed gap-1 flex items-center">
        {label}
        {required && <span className="text-tone-warning-on font-body">(required)</span>}
      </label>
      {children}
      {error && <p className="text-xs font-body text-destructive">{error}</p>}
    </div>
  );
}
