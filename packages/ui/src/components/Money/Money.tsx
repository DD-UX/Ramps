import { clsx } from 'clsx';

/**
 * Money — the canonical way to render an amount in the AP table and drawers.
 *
 * Every list in Bill Pay is a column of right-aligned currency: "$1,297.55",
 * "$14,293,124.54 total" (…/snapshots/18-overview-grouped-by-status.jpeg). Two
 * rules make those columns scan: right alignment and **tabular numerals** so
 * digits line up vertically regardless of value.
 *
 * The contract matches the schema SSoT: money is integer **cents**
 * (MoneyCentsSchema in @ramps/schemas), never a float — we divide by 100 only at
 * the formatting boundary via Intl.NumberFormat. Kept dependency-free (plain
 * `cents: number`) so the primitive layer stays decoupled from the schema layer.
 */
export interface MoneyProps {
  /** Integer minor units (cents). */
  cents: number;
  /** ISO-4217 code; defaults to USD. */
  currency?: string;
  /** BCP-47 locale for grouping/symbol. */
  locale?: string;
  /** Right-align (default) for table columns, or inline for prose. */
  align?: 'right' | 'left';
  /** Mute negative amounts / credits with the hushed tone. */
  muted?: boolean;
  className?: string;
}

export function Money({
  cents,
  currency = 'USD',
  locale = 'en-US',
  align = 'right',
  muted = false,
  className,
}: MoneyProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100);

  return (
    <span
      className={clsx(
        'font-body whitespace-nowrap tabular-nums',
        align === 'right' ? 'text-right' : 'text-left',
        muted ? 'text-hushed' : 'text-ink',
        className,
      )}
    >
      {formatted}
    </span>
  );
}
