import type { Meta, StoryObj } from '@storybook/react-vite';

import { ApprovalsWorkflow } from './ApprovalsWorkflow';
import type { ApprovalsRole, ApprovalsStage, ApprovalsUser } from './stageHelpers';

/**
 * ApprovalsWorkflow — the compound approval chain from snapshot 10
 * (…/10-approvals-add-approver.jpeg): numbered stages of roles/users plus the
 * "＋ Add approver" checkbox picker that appends a stage.
 *
 * The component is domain-free — every story hands it a plain fixture catalog
 * (roles + users) and an initial chain, exactly as an app would pass real data.
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
  { id: 'user-michael', name: 'Michael Scott', roleIds: ['role-admin'] },
  { id: 'user-pam', name: 'Pam Beesly', roleIds: ['role-bookkeeper'] },
  { id: 'user-oscar', name: 'Oscar Martinez', roleIds: ['role-bookkeeper', 'role-approver'] },
  { id: 'user-angela', name: 'Angela Martin', roleIds: ['role-bookkeeper'] },
];

const meta = {
  title: 'Primitives/ApprovalsWorkflow',
  component: ApprovalsWorkflow,
  parameters: { layout: 'padded' },
  args: { roles: ROLES, users: USERS },
  // Frame the interactive chain in a bordered card, the way the draft screen does.
  decorators: [
    (Story) => (
      <div className="max-w-xl rounded-square border-bone bg-white p-rui-4 border">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ApprovalsWorkflow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The snapshot-10 starting point: a single "Any Admin" stage. */
export const Default: Story = {
  args: {
    initialStages: [{ id: 'stage-1', roleIds: ['role-admin'], userIds: [] }],
  },
};

/** No approvers yet — the empty prompt above the picker. */
export const EmptyState: Story = {
  args: { initialStages: [] },
};

/** A stage compounding two roles reads as two bubbles, roles first. */
export const MultiRoleStage: Story = {
  args: {
    initialStages: [{ id: 'stage-1', roleIds: ['role-admin', 'role-bookkeeper'], userIds: [] }],
  },
};

/**
 * A stage of hand-picked users only. Users already covered by no role show in
 * the trailing "Users" bubble; the role↔user dedup keeps the chain honest.
 */
export const UsersOnly: Story = {
  args: {
    initialStages: [
      { id: 'stage-1', roleIds: [], userIds: ['user-harrington', 'user-jane'] },
    ] satisfies ApprovalsStage[],
  },
};

/** A longer chain — three stages renumber 1…3 from list position. */
export const LongChain: Story = {
  args: {
    initialStages: [
      { id: 'stage-1', roleIds: ['role-admin'], userIds: [] },
      { id: 'stage-2', roleIds: ['role-approver'], userIds: [] },
      { id: 'stage-3', roleIds: [], userIds: ['user-harrington'] },
    ],
  },
};
