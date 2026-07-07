import type { BadgeProps } from '@ramps/ui/Badge';

import type { SectionCompleteness } from '../helpers/section-completeness.helpers';

/**
 * How each section-completeness state renders as a `Badge` — the label + tone
 * pairing behind the amber/green pills (snapshots 6–7). `Complete` reads
 * positive-green, `Incomplete` warning-amber, `Optional` a quiet neutral.
 */
export const COMPLETENESS_BADGE: Record<
  SectionCompleteness,
  { label: string; tone: NonNullable<BadgeProps['tone']> }
> = {
  complete: { label: 'Complete', tone: 'positive' },
  incomplete: { label: 'Incomplete', tone: 'warning' },
  optional: { label: 'Optional', tone: 'neutral' },
};
