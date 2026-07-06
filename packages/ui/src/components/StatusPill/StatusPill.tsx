import { cn } from '../../lib/cn';

/**
 * StatusPill — the bill lifecycle rendered as a token-tinted badge.
 *
 * The bill lifecycle is the product spine (see docs/watch-youtube/README.md §1):
 * status is "a place you live, not just a column." This pill is how that status
 * reads in the dense AP table, the detail drawer, and the status-grouped
 * Overview. Each lifecycle state maps to a restrained *tone* (surface + on
 * colour) sourced from tokens — never a raw hex, never a pure red (Ramp's
 * destructive family is orange).
 *
 * The status union mirrors the `bills.status` enum in ANALYSIS.md §4; keeping
 * the two in lockstep is deliberate — the schema is the SSoT and this map is
 * the visual projection of it.
 */
export type BillStatus =
  | 'draft'
  | 'missing_info'
  | 'awaiting_approval'
  | 'approved'
  | 'scheduled'
  | 'partially_paid'
  | 'paid'
  | 'rejected'
  | 'archived';

type Tone = 'neutral' | 'info' | 'accent' | 'positive' | 'warning' | 'critical';

const TONE_STYLE: Record<Tone, string> = {
  neutral: 'bg-tone-neutral-surface text-tone-neutral-on',
  info: 'bg-tone-info-surface text-tone-info-on',
  accent: 'bg-tone-accent-surface text-tone-accent-on',
  positive: 'bg-tone-positive-surface text-tone-positive-on',
  warning: 'bg-tone-warning-surface text-tone-warning-on',
  critical: 'bg-tone-critical-surface text-tone-critical-on',
};

/** Lifecycle state → { human label, tone }. The single mapping other surfaces read. */
const STATUS_META: Record<BillStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  missing_info: { label: 'Missing info', tone: 'warning' },
  awaiting_approval: { label: 'Awaiting approval', tone: 'info' },
  approved: { label: 'Approved', tone: 'positive' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  partially_paid: { label: 'Partially paid', tone: 'info' },
  paid: { label: 'Paid', tone: 'positive' },
  rejected: { label: 'Rejected', tone: 'critical' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export interface StatusPillProps {
  status: BillStatus;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const { label, tone } = STATUS_META[status];
  return (
    <span
      // A pill: fully-rounded, small, tinted. Weight/spacing come from tokens.
      className={cn(
        'gap-rui-1 rounded-pill px-rui-3 py-rui-1 text-xs font-heading inline-flex items-center whitespace-nowrap',
        TONE_STYLE[tone],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-pill bg-current opacity-70" />
      {label}
    </span>
  );
}

/** Exposed so tables/filters can iterate the lifecycle without re-declaring it. */
export const BILL_STATUSES = Object.keys(STATUS_META) as BillStatus[];
