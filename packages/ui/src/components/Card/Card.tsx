import { clsx } from 'clsx';
import type { ReactNode } from 'react';

/**
 * Card — the sectioned content container that structures Bill Pay's forms and
 * summaries.
 *
 * It frames the grouped sections in the bill-detail drawer (Bill details,
 * Payment details, Line items) and the approval recommendation cards
 * ("Review recommended" / "Ready to approve" — docs/watch-youtube/README.md §5).
 * A soft `tone` border/tint lets a card carry meaning (amber = review, positive
 * = ready) while staying calm; the default is a plain limestone surface on a
 * bone hairline.
 *
 * Composed of Card + Card.Header + Card.Body so callers assemble their own
 * content; tokens only.
 */
export type CardTone = 'default' | 'info' | 'positive' | 'warning' | 'critical';

const TONE_BORDER: Record<CardTone, string> = {
  default: 'border-bone',
  info: 'border-tone-info-on/30',
  positive: 'border-tone-positive-on/40',
  warning: 'border-tone-warning-on/40',
  critical: 'border-destructive/40',
};

export interface CardProps {
  children: ReactNode;
  tone?: CardTone;
  className?: string;
}

export function Card({ children, tone = 'default', className }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-surface border bg-limestone',
        TONE_BORDER[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  children: ReactNode;
  /** Trailing slot for a Badge, action, or count. */
  action?: ReactNode;
  className?: string;
}

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

export interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

function CardBody({ children, className }: CardBodyProps) {
  return <div className={clsx('px-rui-4 py-rui-3 font-body text-ink', className)}>{children}</div>;
}

Card.Header = CardHeader;
Card.Body = CardBody;
