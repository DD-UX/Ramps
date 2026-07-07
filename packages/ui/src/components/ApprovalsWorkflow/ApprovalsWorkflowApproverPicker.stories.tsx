import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../Button/Button';
import { ApprovalsWorkflowApproverPicker } from './ApprovalsWorkflowApproverPicker';
import type { ApprovalsRole, ApprovalsUser } from './stageHelpers';

/**
 * ApprovalsWorkflowApproverPicker stories — the click Popover behind BOTH
 * "＋ Add approver" and a stage row's ⋮ **Edit**. Its body is one grouped,
 * scrollable checkbox list (Roles, then Users); the footer commits the checked
 * mix as a stage.
 *
 * Two modes over the same body:
 * - `add` (default) renders its own "＋ Add approver" trigger and commits a NEW
 *   stage — click it to open the list.
 * - `edit` is consumer-driven: it takes a `trigger`, controlled `open`, and
 *   `initialRoleIds`/`initialUserIds` to prefill, and Save replaces the stage.
 *
 * `hideRoleIds` drops already-used roles so a role only approves once; users are
 * never hidden. `onSubmit` is a no-op logger here — ApprovalsWorkflow wires the
 * real add/edit/remove.
 */
const ROLES: ApprovalsRole[] = [
  { id: 'role-admin', name: 'Any Admin' },
  { id: 'role-approver', name: 'Any Approver' },
  { id: 'role-bookkeeper', name: 'Any Bookkeeper' },
];

const USERS: ApprovalsUser[] = [
  { id: 'user-hannah', name: 'Hannah Smolinski', roleIds: ['role-admin'] },
  { id: 'user-diego', name: 'Diego Díaz', roleIds: ['role-admin', 'role-approver'] },
  { id: 'user-jane', name: 'Jane Doe', roleIds: ['role-approver'] },
  { id: 'user-harrington', name: 'Harrington Smith', roleIds: [] },
  { id: 'user-pam', name: 'Pam Beesly', roleIds: ['role-bookkeeper'] },
  { id: 'user-oscar', name: 'Oscar Martinez', roleIds: ['role-bookkeeper'] },
];

const meta = {
  title: 'Primitives/ApprovalsWorkflowApproverPicker',
  component: ApprovalsWorkflowApproverPicker,
  parameters: { layout: 'padded' },
  args: {
    roles: ROLES,
    users: USERS,
    onSubmit: () => {},
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl rounded-square border-bone bg-white p-rui-4 border">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ApprovalsWorkflowApproverPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Edit mode is consumer-driven (controlled open + a trigger), so it lives in a
 * small component that owns the open state — the same shape a stage row uses.
 * Starts open so the prefilled list is visible on load.
 */
function EditDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex justify-end">
      <ApprovalsWorkflowApproverPicker
        roles={ROLES}
        users={USERS}
        mode="edit"
        open={open}
        onOpenChange={setOpen}
        initialRoleIds={['role-admin']}
        initialUserIds={['user-harrington']}
        hideRoleIds={['role-approver']}
        onSubmit={() => {}}
        trigger={
          <Button variant="subtle" size="sm">
            Edit stage
          </Button>
        }
      />
    </div>
  );
}

/** Add mode — the built-in "＋ Add approver" row. Click it to open the list. */
export const Add: Story = {
  args: { mode: 'add' },
};

/**
 * Add mode with roles excluded — two roles are already used in the chain, so the
 * Roles section offers only the remaining one (users unaffected). Open to see it.
 */
export const AddRolesExcluded: Story = {
  args: {
    mode: 'add',
    hideRoleIds: ['role-admin', 'role-approver'],
  },
};

/**
 * Add mode, all roles used — the Roles section collapses to the "All roles
 * already added." note; the Users section still lists everyone. Open to see it.
 */
export const AddAllRolesUsed: Story = {
  args: {
    mode: 'add',
    hideRoleIds: ['role-admin', 'role-approver', 'role-bookkeeper'],
  },
};

/**
 * Edit mode, rendered open — the consumer supplies a trigger + controlled open
 * and prefills the stage's selection ("Any Admin" + Harrington checked), so the
 * footer commits **Save**. The row hides OTHER stages' roles via `hideRoleIds`;
 * this stage's own role stays selectable (so it can be unchecked).
 */
export const EditOpen: Story = {
  render: () => <EditDemo />,
};
