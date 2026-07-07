import { Badge } from '@ramps/ui/Badge';

import { COMPLETENESS_BADGE } from '../constants/section-completeness.constants';
import type { SectionCompleteness } from '../helpers/section-completeness.helpers';

export interface BillDetailsCompletenessBadgeProps {
  state: SectionCompleteness;
}

/**
 * The amber/green/neutral pill each section header carries (snapshots 6–7):
 * `Complete`, `Incomplete`, `Optional`. A thin lookup over the shared
 * {@link COMPLETENESS_BADGE} map so every section renders the same badge for the
 * same state — one place to restyle all of them.
 */
export function BillDetailsCompletenessBadge({ state }: BillDetailsCompletenessBadgeProps) {
  const { label, tone } = COMPLETENESS_BADGE[state];
  return <Badge tone={tone}>{label}</Badge>;
}
