'use client';

import { Avatar } from '@ramps/ui/Avatar';
import { Badge } from '@ramps/ui/Badge';
import { Button } from '@ramps/ui/Button';
import { Plus } from '@ramps/ui/icons';

import { useBillDetail } from '../context/BillDetail.context';
import { APPROVAL_STATUS_BADGE } from '../constants/approval-status.constants';
import { BillDetailsSection } from './BillDetailsSection';

/**
 * Approvals section (snapshot 10): the ordered approver chain — "1 · Hannah
 * Smolinski · Any Admin" — with an "Add approver" affordance. Reads the fetched
 * `approvals` off the bill (sorted by sequence in the SDK); the chain is display
 * + add UI here, not part of the editable bill schema, so it renders from the
 * read model directly. Add is stubbed for this pass.
 */
export function BillDetailsApprovals() {
  const { bill } = useBillDetail();

  return (
    <BillDetailsSection
      title="Approvals"
      action={
        <Button variant="secondary" size="sm" type="button" leadingIcon={<Plus size={14} />}>
          Add approver
        </Button>
      }
    >
      {bill.approvals.length === 0 ? (
        <p className="text-sm font-body text-hushed">
          No approvers yet. Add one to route this bill for approval.
        </p>
      ) : (
        <ol className="gap-rui-2 flex flex-col">
          {bill.approvals.map((step) => {
            const badge = APPROVAL_STATUS_BADGE[step.status];
            return (
              <li
                key={step.id}
                className="gap-rui-3 rounded-square border-bone px-rui-3 py-rui-2 flex items-center border"
              >
                <span className="text-xs font-heading text-hushed tabular-nums">
                  {step.sequence}
                </span>
                <Avatar name={step.approver_name ?? 'Unknown approver'} size="sm" />
                <span className="min-w-0 text-sm font-body text-ink flex-1 truncate">
                  {step.approver_name ?? 'Unknown approver'}
                </span>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </li>
            );
          })}
        </ol>
      )}
    </BillDetailsSection>
  );
}
