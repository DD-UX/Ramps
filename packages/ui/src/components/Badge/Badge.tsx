import { clsx } from 'clsx';
import type { PropsWithChildren, ReactNode } from 'react';

/**
 * Badge — the compact metadata/count label for everything that ISN'T a bill
 * lifecycle state (that's StatusPill's job).
 *
 * Across Bill Pay these carry provenance and counts rather than status:
 * "Optional" beside a form section, "Coded by Ramp" on auto-filled GL codes,
 * "Recommended"/"New" callouts, "Batched" grouping, and the little counters on
 * tabs ("Needs review (2)") — see docs/watch-youtube/README.md §2 and the
 * bill-detail drawer frame (…/snapshots/09-inline-payment-details-overdue-banner.jpeg,
 * the "Optional" tag next to Payment details).
 *
 * Tones reuse the shared tone families (tokens only); `subtle` keeps it quiet
 * for inline metadata, `solid` for a stronger callout.
 */
export type BadgeTone = 'neutral' | 'info' | 'accent' | 'positive' | 'warning' | 'critical';
export type BadgeVariant = 'subtle' | 'solid';
/**
 * Shape: `square` (0px, the house default for rectangular chrome) or `pill`
 * (fully rounded) — the count-badge shape the Tabs bar established, adopted
 * by the SideMenu nav counts too.
 */
export type BadgeShape = 'square' | 'pill';

const SUBTLE_STYLE: Record<BadgeTone, string> = {
  // ap-agent frames 7/8: the neutral chips — the inline vendor tag
  // ("W.B. Mason"/"Staples") and the doc-count chips on the check rows — are
  // INK text on the light gray surface, not the hushed gray the seed used.
  neutral: 'bg-tone-neutral-surface text-ink',
  info: 'bg-tone-info-surface text-tone-info-on',
  accent: 'bg-tone-accent-surface text-tone-accent-on',
  positive: 'bg-tone-positive-surface text-tone-positive-on',
  warning: 'bg-tone-warning-surface text-tone-warning-on',
  critical: 'bg-tone-critical-surface text-tone-critical-on',
};

const SOLID_STYLE: Record<BadgeTone, string> = {
  neutral: 'bg-hushed text-limestone',
  info: 'bg-tone-info-on text-limestone',
  accent: 'bg-accent text-ink',
  positive: 'bg-tone-positive-on text-limestone',
  warning: 'bg-tone-warning-on text-limestone',
  critical: 'bg-destructive text-limestone',
};

export type BadgeProps = PropsWithChildren<{
  tone?: BadgeTone;
  variant?: BadgeVariant;
  /** Corner shape — `square` (default) or `pill` for count badges. */
  shape?: BadgeShape;
  /** Optional leading glyph (icon/dot). */
  icon?: ReactNode;
  className?: string;
  /** Accessible label for count badges (e.g. the SideMenu's "90 items"). */
  'aria-label'?: string;
}>;

export function Badge({
  children,
  tone = 'neutral',
  variant = 'subtle',
  shape = 'square',
  icon,
  className,
  'aria-label': ariaLabel,
}: BadgeProps) {
  const style = variant === 'solid' ? SOLID_STYLE[tone] : SUBTLE_STYLE[tone];
  return (
    <span
      aria-label={ariaLabel}
      className={clsx(
        'gap-rui-1 px-rui-2 py-0.5 text-xs font-heading inline-flex items-center whitespace-nowrap',
        shape === 'pill' ? 'rounded-pill' : 'rounded-square',
        style,
        className,
      )}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </span>
  );
}
