'use client';

import { useState } from 'react';

import {
  APPROVAL_ROLES,
  APPROVAL_USERS,
  INITIAL_APPROVAL_STAGES,
} from '../constants/approvals.constants';
import { isStageEmpty } from '../helpers/stage.helpers';
import type {
  ApprovalRoleType,
  ApprovalStageType,
  ApprovalUserType,
} from '../types/approvals.types';
import { ApprovalsAddApproverPicker } from './ApprovalsAddApproverPicker';
import { ApprovalsStageRow } from './ApprovalsStageRow';

/**
 * ApprovalsWorkflow — the snapshot-10 approval chain: an ordered list of stages,
 * each a compounded set of roles/users, plus the "＋ Add approver" picker that
 * appends a new stage.
 *
 * Owns the (mocked, in-memory) stage list. Each Add commits the picker's
 * checked roles + users as one new stage; stages that would render empty after
 * the role↔user dedup are skipped. Remove drops a stage; the sequence numbers
 * renumber from the list position so the chain always reads 1…N.
 */
export interface ApprovalsWorkflowProps {
  roles?: ApprovalRoleType[];
  users?: ApprovalUserType[];
  initialStages?: ApprovalStageType[];
}

export function ApprovalsWorkflow({
  roles = APPROVAL_ROLES,
  users = APPROVAL_USERS,
  initialStages = INITIAL_APPROVAL_STAGES,
}: ApprovalsWorkflowProps) {
  const [stages, setStages] = useState<ApprovalStageType[]>(initialStages);

  function handleAdd(selection: { roleIds: string[]; userIds: string[] }) {
    const stage: ApprovalStageType = {
      id: `stage-${crypto.randomUUID()}`,
      roleIds: selection.roleIds,
      userIds: selection.userIds,
    };
    // Skip a stage that's all-dedup (only users already inside a checked role).
    if (isStageEmpty(stage, users)) return;
    setStages((prev) => [...prev, stage]);
  }

  function handleRemove(stageId: string) {
    setStages((prev) => prev.filter((stage) => stage.id !== stageId));
  }

  return (
    <div className="gap-rui-2 flex flex-col">
      {stages.length > 0 ? (
        <ol className="gap-rui-2 flex flex-col">
          {stages.map((stage, index) => (
            <ApprovalsStageRow
              key={stage.id}
              stage={stage}
              sequence={index + 1}
              roles={roles}
              users={users}
              onRemove={handleRemove}
            />
          ))}
        </ol>
      ) : (
        <p className="px-rui-3 py-rui-2 text-sm font-body text-hushed">
          No approvers yet. Add a role or user to route this bill for approval.
        </p>
      )}

      <ApprovalsAddApproverPicker roles={roles} users={users} onAdd={handleAdd} />
    </div>
  );
}
