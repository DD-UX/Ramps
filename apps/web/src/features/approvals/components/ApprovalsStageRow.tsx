import { Trash2 } from '@ramps/ui/icons';
import { Menu } from '@ramps/ui/Menu';

import { extraUsersForStage, stageRoleBubbles } from '../helpers/stage.helpers';
import type {
  ApprovalRoleType,
  ApprovalStageType,
  ApprovalUserType,
} from '../types/approvals.types';
import { ApprovalsApproverBubble } from './ApprovalsApproverBubble';

/**
 * ApprovalsStageRow — one numbered step in the chain (snapshot 10): a sequence
 * marker, the stage's approver bubbles, and the row's ⋮ overflow menu with a
 * destructive **Remove**.
 *
 * Bubbles read left→right, roles first (one per role, each showing that role's
 * members), then a single "Users" bubble for the individually-picked users not
 * already covered by a role. The role↔user dedup lives in the stage helpers so
 * a person never renders twice on the same stage.
 */
export interface ApprovalsStageRowProps {
  stage: ApprovalStageType;
  /** 1-based position shown in the leading marker. */
  sequence: number;
  roles: ApprovalRoleType[];
  users: ApprovalUserType[];
  onRemove: (stageId: string) => void;
}

export function ApprovalsStageRow({
  stage,
  sequence,
  roles,
  users,
  onRemove,
}: ApprovalsStageRowProps) {
  const roleBubbles = stageRoleBubbles(stage, roles, users);
  const extraUsers = extraUsersForStage(stage, users);

  return (
    <li className="gap-rui-3 rounded-square border-bone px-rui-3 py-rui-2 flex items-center border">
      {/* Sequence marker — the round number chip from the frame. */}
      <span
        aria-hidden
        className="size-6 rounded-pill bg-limestone text-xs font-heading text-hushed inline-flex shrink-0 items-center justify-center tabular-nums"
      >
        {sequence}
      </span>

      {/* Bubbles: roles first, then the deduped extra-users bubble. */}
      <div className="gap-rui-4 min-w-0 flex flex-1 flex-wrap items-center">
        {roleBubbles.map(({ role, members }) => (
          <ApprovalsApproverBubble key={role.id} people={members} label={role.name} />
        ))}
        {extraUsers.length > 0 ? (
          <ApprovalsApproverBubble people={extraUsers} label="Users" />
        ) : null}
      </div>

      <Menu
        label={`Stage ${sequence} actions`}
        items={[
          {
            label: 'Remove',
            tone: 'destructive',
            icon: <Trash2 size={14} />,
            onSelect: () => onRemove(stage.id),
          },
        ]}
      />
    </li>
  );
}
