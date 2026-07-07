'use client';

import { Button } from '@ramps/ui/Button';
import { Checkbox } from '@ramps/ui/Checkbox';
import { Plus } from '@ramps/ui/icons';
import { Popover } from '@ramps/ui/Popover';
import { UserAvatars } from '@ramps/ui/UserAvatars';
import { useMemo, useState } from 'react';

import { membersOfRole } from '../helpers/stage.helpers';
import type { ApprovalRoleType, ApprovalUserType } from '../types/approvals.types';

/**
 * ApprovalsAddApproverPicker — the "＋ Add approver" row and the picker it opens
 * (snapshot 10). A click {@link Popover} whose body is one grouped, scrollable
 * **checkbox** list: a "Roles" section then a "Users" section. The author
 * checks any mix of roles and users to compound a stage, and the footer **Add**
 * commits them as one new stage.
 *
 * The DS `Dropdown` is single-select, so this is a small custom composition of
 * `Popover` + `Checkbox` over the same skin. Draft selection is local and only
 * lifts to the workflow on Add; Cancel (or click-away) discards it.
 */
export interface ApprovalsAddApproverPickerProps {
  roles: ApprovalRoleType[];
  users: ApprovalUserType[];
  /** Commit the checked roles + users as a new stage. */
  onAdd: (selection: { roleIds: string[]; userIds: string[] }) => void;
}

function toggle(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function ApprovalsAddApproverPicker({
  roles,
  users,
  onAdd,
}: ApprovalsAddApproverPickerProps) {
  const [open, setOpen] = useState(false);
  const [checkedRoles, setCheckedRoles] = useState<Set<string>>(new Set());
  const [checkedUsers, setCheckedUsers] = useState<Set<string>>(new Set());

  const roleMemberCount = useMemo(
    () => new Map(roles.map((role) => [role.id, membersOfRole(users, role.id).length])),
    [roles, users],
  );

  const hasSelection = checkedRoles.size > 0 || checkedUsers.size > 0;

  function reset() {
    setCheckedRoles(new Set());
    setCheckedUsers(new Set());
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Discard the draft whenever the popup closes (Cancel, Esc, click-away).
    if (!next) reset();
  }

  function handleAdd() {
    if (!hasSelection) return;
    onAdd({ roleIds: [...checkedRoles], userIds: [...checkedUsers] });
    reset();
    setOpen(false);
  }

  return (
    <Popover trigger="click" open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger>
        {/* The dashed "＋ Add approver" row from the frame. */}
        <span className="gap-rui-2 px-rui-3 py-rui-2 text-sm font-body text-hushed hover:text-ink inline-flex items-center">
          <span
            aria-hidden
            className="size-6 rounded-pill border-bone inline-flex shrink-0 items-center justify-center border border-dashed"
          >
            <Plus size={14} />
          </span>
          Add approver
        </span>
      </Popover.Trigger>

      {/* Override the card's built-in padding — we own header/list/footer bands. */}
      <Popover.Content className="w-80 p-0">
        <div className="max-h-96 flex flex-col">
          <div className="min-h-0 py-rui-1 flex-1 overflow-auto">
            {/* Roles — checkbox rows with a member count. */}
            <p className="px-rui-3 pt-rui-2 pb-rui-1 text-xs font-body text-hushed">Roles</p>
            <ul>
              {roles.map((role) => {
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

            {/* Users — checkbox rows with avatar + name. */}
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

          {/* Footer band — Cancel + Add, separated from the list. */}
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
              onClick={handleAdd}
            >
              Add
            </Button>
          </div>
        </div>
      </Popover.Content>
    </Popover>
  );
}
