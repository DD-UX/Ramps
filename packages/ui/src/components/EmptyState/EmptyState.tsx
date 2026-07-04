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
        'flex flex-col items-center justify-center gap-rui-2 rounded-square border border-dashed border-bone bg-limestone px-rui-6 py-rui-8 text-center',
        className,
      )}
    >
      {icon && <span className="text-hushed" aria-hidden>{icon}</span>}
      <p className="font-heading text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm font-body text-hushed">{description}</p>}
      {/* gap, not margin: the stack's gap owns the rhythm however many rows render. */}
      {action && <div>{action}</div>}
    </div>
  );
}
