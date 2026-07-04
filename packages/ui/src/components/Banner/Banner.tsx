import { clsx } from 'clsx';
import type { ReactNode } from 'react';

/**
 * Banner — the persistent, section- or page-level message surface.
 *
 * Bill Pay leans on banners hard, and the TONE carries the whole meaning:
 *  - warning (amber): "This bill is 37 days overdue · Get it approved by 1:00 PM
 *    for same-day delivery" (…/snapshots/09-inline-payment-details-overdue-banner.jpeg),
 *    and the fraud/duplicate warnings.
 *  - critical (orange): the blocking "Add missing information for {vendor}" banner
 *    (…/snapshots/06-draft-review-missing-info-red-validation.jpeg). Ramp's
 *    critical family is orange, never a raw red.
 *  - info (blue): "Improved Bill Pay exports…" product notices.
 *  - positive (green): sync/success confirmations.
 *
 * A banner may carry an inline action (the yellow "Add same-day delivery" button)
 * and a dismiss affordance. Presentational only — the app owns the actions.
 */
export type BannerTone = 'info' | 'positive' | 'warning' | 'critical';

const TONE_STYLE: Record<BannerTone, string> = {
  info: 'bg-tone-info-surface text-tone-info-on',
  positive: 'bg-tone-positive-surface text-tone-positive-on',
  warning: 'bg-tone-warning-surface text-tone-warning-on',
  critical: 'bg-tone-critical-surface text-tone-critical-on',
};

export interface BannerProps {
  tone?: BannerTone;
  title: ReactNode;
  description?: ReactNode;
  /** Optional leading glyph (status icon). */
  icon?: ReactNode;
  /** Inline action node (e.g. a Button). Rendered on the trailing edge. */
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Banner({
  tone = 'info',
  title,
  description,
  icon,
  action,
  onDismiss,
  className,
}: BannerProps) {
  return (
    <div
      role="status"
      className={clsx(
        'flex items-start gap-rui-3 rounded-surface px-rui-4 py-rui-3',
        TONE_STYLE[tone],
        className,
      )}
    >
      {icon && (
        <span aria-hidden className="mt-0.5 shrink-0">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-heading">{title}</p>
        {description && <p className="mt-0.5 text-xs font-body opacity-80">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-rui-1 shrink-0 rounded-control px-rui-1 leading-none opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-control-ring"
        >
          ×
        </button>
      )}
    </div>
  );
}
