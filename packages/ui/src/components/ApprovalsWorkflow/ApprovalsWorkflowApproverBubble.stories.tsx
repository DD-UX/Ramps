import type { Meta, StoryObj } from '@storybook/react-vite';

import { ApprovalsWorkflowApproverBubble } from './ApprovalsWorkflowApproverBubble';
import type { ApprovalsUser } from './stageHelpers';

/**
 * ApprovalsWorkflowApproverBubble stories — the "who signs off" chip a stage row
 * renders once per role (label = role name) and once for the trailing extra
 * users (label = "Users"). Presentational: it takes the resolved people + label,
 * shows an overlapping avatar cluster, then the lead person's name over the
 * group label (the snapshot-10 "((HS)) Hannah Smolinski · Any Admin" shape).
 *
 * The same bubble is exercised in context by the ApprovalsWorkflow /
 * ApprovalsWorkflowStageRow stories; these isolate each people/label state.
 */
const PEOPLE: ApprovalsUser[] = [
  { id: 'user-hannah', name: 'Hannah Smolinski', roleIds: ['role-admin'] },
  { id: 'user-diego', name: 'Diego Díaz', roleIds: ['role-admin'] },
  { id: 'user-michael', name: 'Michael Scott', roleIds: ['role-admin'] },
  { id: 'user-pam', name: 'Pam Beesly', roleIds: ['role-admin'] },
  { id: 'user-oscar', name: 'Oscar Martinez', roleIds: ['role-admin'] },
];

const meta = {
  title: 'Primitives/ApprovalsWorkflowApproverBubble',
  component: ApprovalsWorkflowApproverBubble,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ApprovalsWorkflowApproverBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single-member role — one avatar, the lead name over the role label. */
export const SingleMember: Story = {
  args: {
    people: [PEOPLE[0]],
    label: 'Any Admin',
  },
};

/** A multi-member role — the cluster overlaps up to 3, lead name leads. */
export const MultiMember: Story = {
  args: {
    people: PEOPLE.slice(0, 3),
    label: 'Any Admin',
  },
};

/** More than the cluster max — UserAvatars caps at 3 and shows a "+N" overflow. */
export const Overflow: Story = {
  args: {
    people: PEOPLE,
    label: 'Any Admin',
  },
};

/** The trailing extra-users bubble — same shape, the generic "Users" label. */
export const UsersLabel: Story = {
  args: {
    people: [PEOPLE[1], PEOPLE[3]],
    label: 'Users',
  },
};

/**
 * Empty people (defensive) — with no lead, the label stands in for the name so
 * the bubble never renders a blank first line.
 */
export const NoLead: Story = {
  args: {
    people: [],
    label: 'Any Approver',
  },
};

/** A long name + long label both truncate rather than push the row wider. */
export const Truncates: Story = {
  render: (args) => (
    <div className="max-w-48">
      <ApprovalsWorkflowApproverBubble {...args} />
    </div>
  ),
  args: {
    people: [{ id: 'user-long', name: 'Alexandria Featherstonehaugh-Worthington', roleIds: [] }],
    label: 'Any Regional Approving Manager',
  },
};
