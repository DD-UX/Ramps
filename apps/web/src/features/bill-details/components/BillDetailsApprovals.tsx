'use client';

import { type ApprovalsStage, ApprovalsWorkflow } from '@ramps/ui/ApprovalsWorkflow';
import { useCallback, useMemo } from 'react';

import { useApproverCandidateUsers } from '@/features/common/hooks/useApproverCandidateUsers';

import { isApprovalRouteEditable } from '../constants/approval-editable.constants';
import { useBillDetail } from '../context/BillDetail.context';
import {
  fromWorkflowStages,
  toApprovalsRoles,
  toApprovalsUsers,
  toWorkflowStages,
} from '../helpers/approvals-workflow.helpers';
import { BillDetailsSection } from './BillDetailsSection';

/**
 * Approvals section (snapshot 10): the ordered approver chain — "1 · Hannah
 * Smolinski · Any Admin" — built on the design system's {@link ApprovalsWorkflow}
 * chain editor.
 *
 * This file is only the domain seam: it feeds the domain-free component its
 * approver **catalog** (every role as an "Any …" group + the people directory)
 * and the bill's persisted route as `initialStages`, then STAGES each edit onto
 * the context's `pendingApprovalStagesRef` — nothing is written here. The
 * footer's "Save draft" action owns the persist, so route edits ride the same
 * explicit save as the rest of the form instead of firing a PUT per change. The
 * people directory comes from the shared {@link useApproverCandidateUsers} cache
 * — seeded by the route, not drilled — so this section reads it directly instead
 * of off the bill context. The mappers in `approvals-workflow.helpers` translate
 * between our role-enum / user-UUID model and the component's opaque string ids,
 * so neither side leaks into the other.
 *
 * The chain is editable only while the bill is pre-submit (`draft` /
 * `missing_info`); past that the same component renders `readOnly` — a static
 * record of the route — with the identical guard the PUT route enforces, so the
 * lock is one rule shared by client and server.
 */
export function BillDetailsApprovals() {
  const { bill, leftPaneRef, pendingApprovalStagesRef } = useBillDetail();
  // The approver catalog comes from its own cache hook, not the context — seeded
  // by the route on first paint, then shared across every picker in the app.
  const { users } = useApproverCandidateUsers();

  const readOnly = !isApprovalRouteEditable(bill.status);

  // The approver catalog + the bill's saved route, mapped into the DS's opaque
  // string-id shapes once. `initialStages` seeds the component's own working
  // state; the component owns the chain from there and calls back on each edit.
  const roles = useMemo(() => toApprovalsRoles(), []);
  const catalog = useMemo(() => toApprovalsUsers(users), [users]);
  const initialStages = useMemo(
    () => toWorkflowStages(bill.approval_stages),
    [bill.approval_stages],
  );

  const handleChange = useCallback(
    (stages: ApprovalsStage[]) => {
      // Stage, don't save: map the DS chain back to our save payload (dropping
      // any stale role ids / empty stages) and park it for the footer's "Save
      // draft" to PUT. The component already reflects the change on screen.
      pendingApprovalStagesRef.current = fromWorkflowStages(stages);
    },
    [pendingApprovalStagesRef],
  );

  return (
    <BillDetailsSection title="Approvals">
      <ApprovalsWorkflow
        roles={roles}
        users={catalog}
        initialStages={initialStages}
        readOnly={readOnly}
        onChange={readOnly ? undefined : handleChange}
        // Clamp every approver-picker popover to the split's LEFT PANE so the
        // w-80 card can't spill across the DraggablePanel divider into the
        // invoice preview. The ref is the same node BillDetailsContent hands
        // the DraggablePanel; it's null until that panel mounts.
        boundary={leftPaneRef}
      />
    </BillDetailsSection>
  );
}
