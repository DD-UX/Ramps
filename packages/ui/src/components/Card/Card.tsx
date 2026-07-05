import { clsx } from 'clsx';
import type { PropsWithChildren, ReactNode } from 'react';

/**
 * Card — the sectioned content container that structures Bill Pay's forms and
 * summaries.
 *
 * Re-vetted against snapshot 8 (the "Ready to approve" panel) at 10x corner
 * zoom: the Ramp card is ONE white, sharp-cornered, uniformly padded surface —
 * there is NO hairline divider between the title row and the body, the title
 * and content share the same left edge, and the edge itself is a single pale
 * tinted border with a wide soft halo (`elevation="glow"`; the old extra
 * shadow ring doubled that edge and is gone from the token).
 *
 * Rhythm is gap-driven, not margin-driven: the card is a flex column and the
 * gap owns the spacing whether a caller renders a header, a body, or both.
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
        // One white, square, uniformly padded surface on a thin tinted border
        // (snapshot 8). The column gap — not margins — spaces header and body.
        'gap-rui-3 rounded-square bg-white p-rui-4 flex flex-col border',
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

/**
 * The title row — no divider, no padding of its own (snapshot 8 shows the
 * title sitting directly on the card's padded surface, flush with the body).
 */
function CardHeader({ children, action, className }: CardHeaderProps) {
  return (
    <div className={clsx('gap-rui-3 flex items-center justify-between', className)}>
      <div className="min-w-0 text-sm font-heading text-ink">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export type CardBodyProps = PropsWithChildren<{
  className?: string;
}>;

function CardBody({ children, className }: CardBodyProps) {
  return <div className={clsx('font-body text-ink', className)}>{children}</div>;
}

Card.Header = CardHeader;
Card.Body = CardBody;
