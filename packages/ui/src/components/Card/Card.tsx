import { clsx } from 'clsx';
import type { PropsWithChildren, ReactNode } from 'react';

/**
 * Card — the sectioned content container that structures Bill Pay's forms and
 * summaries.
 *
 * Reworked against snapshot 8 (the bill-detail "Ready to approve" panel): the
 * Ramp card is a **white, near-square, soft-shadowed** surface — not the tinted,
 * softly-rounded limestone box the seed used. The signature approval card adds a
 * **soft glow** (the green positive-tone halo) via `elevation="glow"`; a `tone`
 * still lets a card carry calm meaning through a tinted border.
 *
 * Composed of Card + Card.Header + Card.Body so callers assemble their own
 * content; tokens only.
 */
export type CardTone = 'default' | 'info' | 'positive' | 'warning' | 'critical';
export type CardElevation = 'flat' | 'card' | 'glow';

/** Tinted hairline per tone — restrained, never a hard colour block. */
const TONE_BORDER: Record<CardTone, string> = {
  default: 'border-bone',
  info: 'border-tone-info-on/30',
  positive: 'border-tone-positive-on/40',
  warning: 'border-tone-warning-on/40',
  critical: 'border-destructive/40',
};

/** Elevation → shadow. `glow` is the positive-tone halo from the approval card. */
const ELEVATION_STYLE: Record<CardElevation, string> = {
  flat: '',
  card: 'shadow-card',
  glow: 'shadow-glow',
};

export type CardProps = PropsWithChildren<{
  tone?: CardTone;
  /** Shadow treatment: flat, resting `card`, or the approval `glow`. */
  elevation?: CardElevation;
  className?: string;
}>;

export function Card({ children, tone = 'default', elevation = 'card', className }: CardProps) {
  return (
    <div
      data-testid="card"
      className={clsx(
        // White, near-square surface on a thin border — the snapshot-8 panel.
        'rounded-square border bg-white',
        TONE_BORDER[tone],
        ELEVATION_STYLE[elevation],
        className,
      )}
    >
      {children}
    </div>
  );
}

export type CardHeaderProps = PropsWithChildren<{
  /** Trailing slot for a Badge, action, or count. */
  action?: ReactNode;
  className?: string;
}>;

function CardHeader({ children, action, className }: CardHeaderProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-rui-3 border-b border-bone px-rui-4 py-rui-3',
        className,
      )}
    >
      <div className="min-w-0 text-sm font-heading text-ink">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export type CardBodyProps = PropsWithChildren<{
  className?: string;
}>;

function CardBody({ children, className }: CardBodyProps) {
  return <div className={clsx('px-rui-4 py-rui-3 font-body text-ink', className)}>{children}</div>;
}

Card.Header = CardHeader;
Card.Body = CardBody;
