import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

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
      className={cn(
        'gap-rui-3 rounded-square px-rui-4 py-rui-3 flex items-start',
        TONE_STYLE[tone],
        className,
      )}
    >
      {/* The icon box matches the title's 20px line so a single-line banner
          reads centred; with a description it stays pinned to the first line. */}
      {icon && (
        <span aria-hidden className="h-5 flex shrink-0 items-center">
          {icon}
        </span>
      )}
      {/* gap, not margins: the column owns the rhythm whether the banner is
          one line (title only) or two (title + description). */}
      <div className="min-w-0 gap-0.5 flex flex-1 flex-col">
        <p className="text-sm font-heading">{title}</p>
        {description && <p className="text-xs font-body opacity-80">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-rui-1 rounded-square px-rui-1 shrink-0 cursor-pointer leading-none opacity-70 hover:opacity-100 focus:opacity-100 focus:outline-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
