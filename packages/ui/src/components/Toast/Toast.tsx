import { clsx } from 'clsx';
import type { ReactNode } from 'react';

/**
 * Toast — the transient feedback surface for async actions: "Uploading 3
 * invoices", "Payment scheduled", "Bill approved" (docs/watch-youtube/README.md
 * §2). Presentational + controlled — the app owns show/dismiss and stacking;
 * this renders one toast. Tone borrows the StatusPill families so success reads
 * positive and failures read critical (orange, never red).
 */
export type ToastTone = 'neutral' | 'positive' | 'critical' | 'info';

const TONE_ACCENT: Record<ToastTone, string> = {
  neutral: 'before:bg-hushed',
  positive: 'before:bg-tone-positive-on',
  critical: 'before:bg-destructive',
  info: 'before:bg-tone-info-on',
};

export interface ToastProps {
  title: string;
  description?: ReactNode;
  tone?: ToastTone;
  onDismiss?: () => void;
  className?: string;
}

export function Toast({ title, description, tone = 'neutral', onDismiss, className }: ToastProps) {
  return (
    <div
      role="status"
      className={clsx(
        'relative flex items-start gap-rui-3 overflow-hidden rounded-surface bg-ink px-rui-4 py-rui-3 text-limestone shadow-lg',
        // Left tone accent bar via ::before.
        'before:absolute before:inset-y-0 before:left-0 before:w-1',
        TONE_ACCENT[tone],
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-heading">{title}</p>
        {description && <p className="mt-0.5 text-xs font-body text-bone">{description}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-rui-1 shrink-0 rounded-control px-rui-1 text-bone hover:text-limestone focus:outline-none focus:ring-2 focus:ring-control-ring"
        >
          ×
        </button>
      )}
    </div>
  );
}
