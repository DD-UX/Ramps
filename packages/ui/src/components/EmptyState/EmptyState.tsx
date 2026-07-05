import { clsx } from 'clsx';
import type { ReactNode } from 'react';

/**
 * EmptyState — the centred "nothing here yet" panel for empty tables, filtered
 * lists and first-run screens: the empty Bill Pay upload dropzone before any
 * invoices exist (…/snapshots/02-bill-pay-empty-upload-dropzone.jpeg), and the
 * zero-result state under a status filter.
 *
 * A quiet, centred stack — optional icon, heading, supporting copy, and a primary
 * action slot. Tokens only; the action is passed in (usually a Button) so the kit
 * stays composition-friendly.
 */
export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Primary action slot — typically a Button. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        // Two-level rhythm, gaps only: the outer gap-rui-4 airs out the three
        // zones (icon / text / action) while the inner gap-rui-1 keeps title
        // and description reading as one block — the flat single-gap stack
        // read cluttered.
        'gap-rui-4 rounded-square border-bone bg-limestone px-rui-6 py-rui-8 flex flex-col items-center justify-center border border-dashed text-center',
        className,
      )}
    >
      {icon && (
        <span className="text-hushed" aria-hidden>
          {icon}
        </span>
      )}
      <div className="gap-rui-1 flex flex-col items-center">
        <p className="font-heading text-ink">{title}</p>
        {description && <p className="max-w-sm text-sm font-body text-hushed">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
