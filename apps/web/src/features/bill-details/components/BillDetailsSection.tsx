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
  // Required + never storied (apps/web): explicit `children` over PropsWithChildren
  // is deliberate — a section card with an empty body is a compile error, not a no-op.
  children: ReactNode;
}

export function BillDetailsSection({
  title,
  completeness,
  action,
  children,
}: BillDetailsSectionProps) {
  return (
    <div className="gap-rui-2 grid">
      <div className="gap-rui-3 flex items-center">
        <span className="text-[1.125rem]">{title}</span>
        {completeness && <BillDetailsCompletenessBadge state={completeness} />}
        {action}
      </div>
      <div className="gap-rui-4 flex flex-col">{children}</div>
    </div>
  );
}
