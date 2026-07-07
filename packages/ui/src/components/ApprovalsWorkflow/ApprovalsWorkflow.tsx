'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';

import { ApprovalsWorkflowApproverPicker } from './ApprovalsWorkflowApproverPicker';
import { ApprovalsWorkflowStageRow } from './ApprovalsWorkflowStageRow';
import {
  type ApprovalsRole,
  type ApprovalsStage,
  type ApprovalsUser,
  isStageEmpty,
  moveStage,
  usedRoleIds,
} from './stageHelpers';

// Re-export the model so consumers can type their catalog off the same source.
export type {
  ApprovalsRole,
  ApprovalsStage,
  ApprovalsStageRoleBubble,
  ApprovalsUser,
} from './stageHelpers';

/**
 * ApprovalsWorkflow — the snapshot-10 approval chain: an ordered list of stages,
 * each a compounded set of roles/users, plus the "＋ Add approver" picker that
 * appends a new stage.
 *
 * A self-contained, domain-free composite: the consumer supplies the approver
 * **catalog** (`roles` + `users`) and the initial chain; where that data comes
 * from — Supabase, a mock, Storybook fixtures — is the caller's concern, so the
 * design system stays free of any domain dependency.
 *
 * Owns the working stage list in local state. Add commits the picker's checked
 * roles + users as one new stage; Edit replaces a stage in place; both skip a
 * selection that would render empty after the role↔user dedup. A role only
 * approves once — roles already committed on other stages are hidden from the
 * pickers. Remove drops a stage; sequence numbers renumber from list position so
 * the chain always reads 1…N. `onChange` fires with the new chain after every
 * commit/removal so a parent can persist it.
 *
 * Stages are **drag-to-reorder** ({@link DndContext} + {@link SortableContext},
 * vertical strategy): each row carries a grip handle, a drop commits
 * {@link moveStage} and renumbers the sequence. Both pointer and keyboard drags
 * are wired (the keyboard sensor uses the sortable coordinate getter), so the
 * chain reorders without a mouse. Inserting "in between" is add-then-drag: the
 * "＋ Add approver" picker always appends a new stage at the end, which the
 * author then drags into place.
 *
 * When `readOnly`, the whole chain is frozen: no drag context, no per-row grip
 * or ⋮ actions, and the add picker is dropped — the workflow renders as a static
 * record of the approval route.
 */
export interface ApprovalsWorkflowProps {
  roles: ApprovalsRole[];
  users: ApprovalsUser[];
  /** The chain to start from. Defaults to an empty chain. */
  initialStages?: ApprovalsStage[];
  /** Called with the updated chain after each add/edit/remove/reorder. */
  onChange?: (stages: ApprovalsStage[]) => void;
  /** Freeze the chain: no reorder, no add, no per-row edit/remove. */
  readOnly?: boolean;
}

/** Prefer the platform UUID; fall back for non-secure/older runtimes. */
function stageId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `stage-${crypto.randomUUID()}`;
  }
  return `stage-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ApprovalsWorkflow({
  roles,
  users,
  initialStages = [],
  onChange,
  readOnly = false,
}: ApprovalsWorkflowProps) {
  const [stages, setStages] = useState<ApprovalsStage[]>(initialStages);

  // Pointer for mouse/touch, keyboard for a11y — the keyboard sensor borrows the
  // sortable coordinate getter so arrow keys walk a row through the vertical list.
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function commit(next: ApprovalsStage[]) {
    setStages(next);
    onChange?.(next);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    // A drop outside any row (over == null) or back onto itself is a no-op;
    // moveStage also guards this, so a stray drop can't churn state.
    if (over && active.id !== over.id) {
      commit(moveStage(stages, String(active.id), String(over.id)));
    }
  }

  function handleAdd(selection: { roleIds: string[]; userIds: string[] }) {
    const stage: ApprovalsStage = {
      id: stageId(),
      roleIds: selection.roleIds,
      userIds: selection.userIds,
    };
    // Skip a stage that's all-dedup (only users already inside a checked role).
    if (isStageEmpty(stage, users)) return;
    commit([...stages, stage]);
  }

  function handleEdit(editedId: string, selection: { roleIds: string[]; userIds: string[] }) {
    const next: ApprovalsStage = {
      id: editedId,
      roleIds: selection.roleIds,
      userIds: selection.userIds,
    };
    // An edit that empties a stage removes it, mirroring the add-skip rule.
    if (isStageEmpty(next, users)) {
      commit(stages.filter((stage) => stage.id !== editedId));
      return;
    }
    commit(stages.map((stage) => (stage.id === editedId ? next : stage)));
  }

  function handleRemove(removedId: string) {
    commit(stages.filter((stage) => stage.id !== removedId));
  }

  // Roles already committed anywhere in the chain — hidden from the Add picker so
  // a role only approves once. Each row hides all-but-its-own via usedRoleIds.
  const usedRoles = usedRoleIds(stages);

  // The ordered rows. Rendered inside the DnD context when editable, or bare
  // (frozen) when read-only — the row itself drops its grip/actions on `disabled`.
  const rows = stages.map((stage, index) => (
    <ApprovalsWorkflowStageRow
      key={stage.id}
      stage={stage}
      sequence={index + 1}
      roles={roles}
      users={users}
      hideRoleIds={[...usedRoleIds(stages, stage.id)]}
      disabled={readOnly}
      onEdit={handleEdit}
      onRemove={handleRemove}
    />
  ));

  return (
    <div className="gap-rui-2 flex flex-col">
      {stages.length === 0 ? (
        <p className="px-rui-3 py-rui-2 text-sm font-body text-hushed">
          No approvers yet. Add a role or user to route this bill for approval.
        </p>
      ) : readOnly ? (
        <ol className="gap-rui-2 flex flex-col">{rows}</ol>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={stages.map((stage) => stage.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="gap-rui-2 flex flex-col">{rows}</ol>
          </SortableContext>
        </DndContext>
      )}

      {/* The add affordance appends a new stage at the end; the author drags it
          into place. Dropped entirely when the chain is read-only. */}
      {readOnly ? null : (
        <ApprovalsWorkflowApproverPicker
          roles={roles}
          users={users}
          hideRoleIds={[...usedRoles]}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
}
