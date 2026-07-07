import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ApprovalsWorkflowStageRow } from './ApprovalsWorkflowStageRow';
import type { ApprovalsRole, ApprovalsUser } from './stageHelpers';

/**
 * ApprovalsWorkflowStageRow stories — one numbered step in the chain: the drag
 * grip, the sequence chip, the stage's approver bubbles (roles first, then a
 * deduped "Users" bubble), and the ⋮ overflow menu with **Edit** + a destructive
 * **Remove**. Edit reopens the shared picker prefilled with this stage's
 * selection, anchored to the row's ⋮.
 *
 * The row is a **sortable `<li>`** ({@link useSortable}), so every story wraps it
 * in the `DndContext` + `SortableContext` the workflow provides — without them
 * the sortable hook has no context and the grip is inert. `onEdit`/`onRemove`
 * are no-ops here; the ApprovalsWorkflow stories cover the wired-up
 * commit/remove/reorder behaviour.
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
  title: 'Primitives/ApprovalsWorkflowStageRow',
  component: ApprovalsWorkflowStageRow,
  parameters: { layout: 'padded' },
  args: {
    roles: ROLES,
    users: USERS,
    onEdit: () => {},
    onRemove: () => {},
  },
  // The row is a sortable <li>; mount it in the DnD context + bordered <ol> the
  // workflow provides, seeding SortableContext with this story's stage id.
  decorators: [
    (Story, context) => (
      <div className="max-w-xl rounded-square border-bone bg-white p-rui-4 border">
        <DndContext>
          <SortableContext
            items={context.args.stage ? [context.args.stage.id] : []}
            strategy={verticalListSortingStrategy}
          >
            <ol>
              <Story />
            </ol>
          </SortableContext>
        </DndContext>
      </div>
    ),
  ],
} satisfies Meta<typeof ApprovalsWorkflowStageRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single-role stage — the snapshot-10 default "Any Admin" step. */
export const SingleRole: Story = {
  args: {
    stage: { id: 'stage-1', roleIds: ['role-admin'], userIds: [] },
    sequence: 1,
  },
};

/** Two roles compound into two bubbles, roles first. */
export const MultiRole: Story = {
  args: {
    stage: { id: 'stage-1', roleIds: ['role-admin', 'role-bookkeeper'], userIds: [] },
    sequence: 2,
  },
};

/** Hand-picked users only — a single trailing "Users" bubble. */
export const UsersOnly: Story = {
  args: {
    stage: { id: 'stage-1', roleIds: [], userIds: ['user-harrington', 'user-jane'] },
    sequence: 3,
  },
};

/**
 * Roles + extra users — the role bubble covers its members, and only the users
 * NOT already inside a selected role fall into the trailing "Users" bubble.
 */
export const RolesAndUsers: Story = {
  args: {
    stage: { id: 'stage-1', roleIds: ['role-admin'], userIds: ['user-harrington'] },
    sequence: 1,
  },
};

/**
 * A later position — the sequence chip renders the 1-based number the workflow
 * derives from list order, so the same row reads "4" here.
 */
export const HigherSequence: Story = {
  args: {
    stage: { id: 'stage-1', roleIds: ['role-approver'], userIds: [] },
    sequence: 4,
  },
};

/**
 * Editing with a role hidden — `hideRoleIds` drops roles used by OTHER stages
 * from this row's Edit picker (this stage keeps its own). Open the ⋮ → Edit to
 * see "Any Approver" absent from the Roles list.
 */
export const WithHiddenRole: Story = {
  args: {
    stage: { id: 'stage-1', roleIds: ['role-admin'], userIds: [] },
    sequence: 1,
    hideRoleIds: ['role-approver'],
  },
};

/**
 * Read-only — the frozen row: the drag grip and the ⋮ Edit/Remove menu are both
 * dropped, so it renders as a static record of the step with no affordances.
 */
export const ReadOnly: Story = {
  args: {
    stage: { id: 'stage-1', roleIds: ['role-admin'], userIds: ['user-harrington'] },
    sequence: 1,
    disabled: true,
  },
};
