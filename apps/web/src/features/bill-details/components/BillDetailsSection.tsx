import { Card } from '@ramps/ui/Card';
import type { ReactNode } from 'react';

import type { SectionCompleteness } from '../helpers/section-completeness.helpers';
import { BillDetailsCompletenessBadge } from './BillDetailsCompletenessBadge';

/**
 * BillDetailsSection — the titled `Card` every form section sits in (snapshots
 * 6–7: "Vendor", "Bill details", "Line items", each a card with a title and a
 * completeness pill). One wrapper keeps all sections at the same rhythm and puts
 * the amber/green badge in the same place, so a section body is just its fields.
 */
export interface BillDetailsSectionProps {
  title: string;
  /** The completeness pill for the header; omit for sections without one. */
  completeness?: SectionCompleteness;
  /** Extra header action (e.g. "Select another vendor"). */
  action?: ReactNode;
  children: ReactNode;
}

export function BillDetailsSection({
  title,
  completeness,
  action,
  children,
}: BillDetailsSectionProps) {
  return (
    <Card>
      <Card.Header
        action={
          <div className="gap-rui-2 flex items-center">
            {action}
            {completeness && <BillDetailsCompletenessBadge state={completeness} />}
          </div>
        }
      >
        {title}
      </Card.Header>
      <Card.Body className="gap-rui-4 flex flex-col">{children}</Card.Body>
    </Card>
  );
}
