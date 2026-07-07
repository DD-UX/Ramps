'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Menu } from '../Menu/Menu';
import { ApprovalsWorkflowApproverBubble } from './ApprovalsWorkflowApproverBubble';
import { ApprovalsWorkflowApproverPicker } from './ApprovalsWorkflowApproverPicker';
import {
  APPROVALS_CHIP_CLASS,
  type ApprovalsRole,
  type ApprovalsStage,
  type ApprovalsUser,
  extraUsersForStage,
  stageRoleBubbles,
} from './stageHelpers';

/**
 * ApprovalsWorkflowStageRow — one numbered step in the chain (snapshot 10): a
 * sequence marker, the stage's approver bubbles, and the row's ⋮ overflow menu
 * with **Edit** and a destructive **Remove**.
 *
 * Bubbles read left→right, roles first (one per role, each showing that role's
 * members), then a single "Users" bubble for the individually-picked users not
 * already covered by a role. The role↔user dedup lives in the stage helpers so
 * a person never renders twice on the same stage.
 *
 * Edit reopens the shared approver picker prefilled with this stage's roles/
 * users; saving replaces the stage in place via `onEdit`. `hideRoleIds` are the
 * roles used by OTHER stages (this stage's own roles stay selectable so they can
 * be unchecked).
 */
export interface ApprovalsWorkflowStageRowProps {
  stage: ApprovalsStage;
  /** 1-based position shown in the leading marker. */
  sequence: number;
  roles: ApprovalsRole[];
  users: ApprovalsUser[];
  /** Roles already used by OTHER stages — hidden from this stage's edit picker. */
  hideRoleIds?: string[];
  onEdit: (stageId: string, selection: { roleIds: string[]; userIds: string[] }) => void;
  onRemove: (stageId: string) => void;
}

export function ApprovalsWorkflowStageRow({
  stage,
  sequence,
  roles,
  users,
  hideRoleIds,
  onEdit,
  onRemove,
}: ApprovalsWorkflowStageRowProps) {
  const roleBubbles = stageRoleBubbles(stage, roles, users);
  const extraUsers = extraUsersForStage(stage, users);
  const [editing, setEditing] = useState(false);

  return (
    <li className="gap-rui-3 rounded-square border-bone px-rui-3 py-rui-2 flex items-center border">
      {/* Sequence marker — the round number chip from the frame. */}
      <span aria-hidden className={APPROVALS_CHIP_CLASS}>
        {sequence}
      </span>

      {/* Bubbles: roles first, then the deduped extra-users bubble. */}
      <div className="gap-rui-4 min-w-0 flex flex-1 flex-wrap items-center">
        {roleBubbles.map(({ role, members }) => (
          <ApprovalsWorkflowApproverBubble key={role.id} people={members} label={role.name} />
        ))}
        {extraUsers.length > 0 ? (
          <ApprovalsWorkflowApproverBubble people={extraUsers} label="Users" />
        ) : null}
      </div>

      {/* The ⋮ menu, and — anchored to the same corner — the controlled edit
          picker it opens. The picker's trigger is a zero-size anchor; the menu
          drives its open state so the two popovers never fight for the click. */}
      <div className="relative inline-flex">
        <Menu
          label={`Stage ${sequence} actions`}
          items={[
            {
              label: 'Edit',
              icon: <Pencil size={14} />,
              onSelect: () => setEditing(true),
            },
            {
              label: 'Remove',
              tone: 'destructive',
              icon: <Trash2 size={14} />,
              onSelect: () => onRemove(stage.id),
            },
          ]}
        />
        <div className="right-0 absolute top-full">
          <ApprovalsWorkflowApproverPicker
            mode="edit"
            roles={roles}
            users={users}
            hideRoleIds={hideRoleIds}
            initialRoleIds={stage.roleIds}
            initialUserIds={stage.userIds}
            open={editing}
            onOpenChange={setEditing}
            onSubmit={(selection) => onEdit(stage.id, selection)}
            trigger={<span aria-hidden className="size-0 block" />}
          />
        </div>
      </div>
    </li>
  );
}
