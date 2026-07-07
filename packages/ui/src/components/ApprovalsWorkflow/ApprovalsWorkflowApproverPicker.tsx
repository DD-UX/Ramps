'use client';

import { Plus } from 'lucide-react';
import { type ReactNode, type RefObject, useMemo, useState } from 'react';

import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { Popover } from '../Popover/Popover';
import { UserAvatars } from '../UserAvatars/UserAvatars';
import {
  APPROVALS_CHIP_CLASS,
  type ApprovalsRole,
  type ApprovalsUser,
  membersOfRole,
} from './stageHelpers';

/**
 * ApprovalsWorkflowApproverPicker — the approver picker behind BOTH "＋ Add
 * approver" and a stage row's ⋮ **Edit** (snapshot 10). A click {@link Popover}
 * whose body is one grouped, scrollable **checkbox** list: a "Roles" section
 * then a "Users" section. The author checks any mix to compound a stage, and the
 * footer commits them.
 *
 * The DS `Dropdown` is single-select, so this is a small custom composition of
 * `Popover` + `Checkbox` over the same skin. Draft selection is local and only
 * lifts on Save; Cancel (or click-away) discards it.
 *
 * Two modes over the same body:
 * - `add` (default) — renders its own "＋ Add approver" trigger row; commits a
 *   NEW stage.
 * - `edit` — driven by the row: the consumer supplies `trigger` (the ⋮ menu) and
 *   `initialRoleIds`/`initialUserIds` to prefill; Save replaces the stage.
 *
 * `hideRoleIds` drops already-committed roles from the Roles list so a role only
 * approves once — the edited stage's own roles are kept selectable by the
 * consumer excluding them from this set. Users are never hidden.
 */
export interface ApprovalsWorkflowApproverPickerProps {
  roles: ApprovalsRole[];
  users: ApprovalsUser[];
  /** Commit the checked roles + users (a new stage in add, the same one in edit). */
  onSubmit: (selection: { roleIds: string[]; userIds: string[] }) => void;
  mode?: 'add' | 'edit';
  /** Role ids to hide from the list (already used elsewhere in the chain). */
  hideRoleIds?: string[];
  /** Prefill (edit mode) — the stage's current roles/users. */
  initialRoleIds?: string[];
  initialUserIds?: string[];
  /**
   * Custom trigger (edit mode anchors the popover to the row's ⋮). Omit in add
   * mode to get the built-in "＋ Add approver" row.
   */
  trigger?: ReactNode;
  /** Controlled open (edit mode drives this from the row). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Clip box for the popover card — forwarded to `Popover`. Viewport if unset. */
  boundary?: RefObject<HTMLElement | null>;
}

function toggle(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function ApprovalsWorkflowApproverPicker({
  roles,
  users,
  onSubmit,
  mode = 'add',
  hideRoleIds,
  initialRoleIds,
  initialUserIds,
  trigger,
  open: controlledOpen,
  onOpenChange,
  boundary,
}: ApprovalsWorkflowApproverPickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const [checkedRoles, setCheckedRoles] = useState<Set<string>>(() => new Set(initialRoleIds));
  const [checkedUsers, setCheckedUsers] = useState<Set<string>>(() => new Set(initialUserIds));

  // Re-seed the draft on the open transition so Edit always starts from the
  // stage's committed selection (and Add from the defaults). Adjusting state
  // during render on a changed input is React's recommended pattern here — no
  // effect, no cascading render (https://react.dev/reference/react/useState#storing-information-from-previous-renders).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setCheckedRoles(new Set(initialRoleIds));
      setCheckedUsers(new Set(initialUserIds));
    }
  }

  const hidden = useMemo(() => new Set(hideRoleIds), [hideRoleIds]);
  const visibleRoles = useMemo(() => roles.filter((role) => !hidden.has(role.id)), [roles, hidden]);

  const roleMemberCount = useMemo(
    () => new Map(roles.map((role) => [role.id, membersOfRole(users, role.id).length])),
    [roles, users],
  );

  const hasSelection = checkedRoles.size > 0 || checkedUsers.size > 0;

  function reset() {
    setCheckedRoles(new Set(initialRoleIds));
    setCheckedUsers(new Set(initialUserIds));
  }

  function setOpen(next: boolean) {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Discard the draft whenever the popup closes (Cancel, Esc, click-away).
    if (!next) reset();
  }

  function handleSubmit() {
    if (!hasSelection) return;
    onSubmit({ roleIds: [...checkedRoles], userIds: [...checkedUsers] });
    setOpen(false);
  }

  return (
    <Popover trigger="click" open={open} onOpenChange={handleOpenChange} boundary={boundary}>
      <Popover.Trigger className="w-full">
        {trigger ?? (
          // The "＋ Add approver" row — the ＋ circle matches the numbered chips,
          // and the whole row reads as a button (hover fill + medium ink label).
          //
          // A leading, invisible spacer mirrors the stage row's DRAG GRIP
          // footprint (`size-6 -ml-rui-1` + the following `gap-rui-3`) so the ＋
          // chip lands directly under the numbered chips of the rows above.
          // Without it the grip-less Add row would sit one grip-width (32px) to
          // the left, breaking the 1 → 2 → ＋ column. Structural rather than a
          // magic pad: it tracks the same tokens, so if the grip resizes the
          // Add row stays aligned.
          <span className="gap-rui-3 rounded-square px-rui-3 py-rui-2 hover:bg-limestone flex w-full items-center transition-colors">
            <span aria-hidden className="-ml-rui-1 size-6 shrink-0" />
            <span aria-hidden className={APPROVALS_CHIP_CLASS}>
              <Plus size={14} />
            </span>
            <span className="text-sm font-heading text-ink">Add approver</span>
          </span>
        )}
      </Popover.Trigger>

      {/* Override the card's built-in padding — we own header/list/footer bands. */}
      <Popover.Content className="w-80 p-0">
        <div className="max-h-96 flex flex-col">
          <div className="min-h-0 py-rui-1 flex-1 overflow-auto">
            {/* Roles — checkbox rows with a member count. Already-used roles are
                filtered out so a role only approves once. */}
            <p className="px-rui-3 pt-rui-2 pb-rui-1 text-xs font-body text-hushed">Roles</p>
            {visibleRoles.length > 0 ? (
              <ul>
                {visibleRoles.map((role) => {
                  const count = roleMemberCount.get(role.id) ?? 0;
                  return (
                    <li key={role.id}>
                      <label className="gap-rui-3 px-rui-3 py-rui-2 hover:bg-limestone flex cursor-pointer items-center">
                        <Checkbox
                          checked={checkedRoles.has(role.id)}
                          onChange={() => setCheckedRoles((prev) => toggle(prev, role.id))}
                        />
                        <span className="min-w-0 text-sm font-body text-ink flex-1 truncate">
                          {role.name}
                        </span>
                        <span className="text-xs font-body text-hushed shrink-0 tabular-nums">
                          {count} {count === 1 ? 'person' : 'people'}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-rui-3 py-rui-2 text-sm font-body text-hushed">
                All roles already added.
              </p>
            )}

            {/* Users — checkbox rows with avatar + name. Never filtered. */}
            <p className="px-rui-3 pt-rui-3 pb-rui-1 text-xs font-body text-hushed">Users</p>
            <ul>
              {users.map((user) => (
                <li key={user.id}>
                  <label className="gap-rui-3 px-rui-3 py-rui-2 hover:bg-limestone flex cursor-pointer items-center">
                    <Checkbox
                      checked={checkedUsers.has(user.id)}
                      onChange={() => setCheckedUsers((prev) => toggle(prev, user.id))}
                    />
                    <UserAvatars people={[{ name: user.name, src: user.src }]} size="sm" />
                    <span className="min-w-0 text-sm font-body text-ink flex-1 truncate">
                      {user.name}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer band — Cancel + submit, separated from the list. */}
          <div className="gap-rui-2 border-bone px-rui-3 py-rui-2 flex items-center justify-end border-t">
            <Button
              variant="subtle"
              size="sm"
              type="button"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={!hasSelection}
              onClick={handleSubmit}
            >
              {mode === 'edit' ? 'Save' : 'Add'}
            </Button>
          </div>
        </div>
      </Popover.Content>
    </Popover>
  );
}
