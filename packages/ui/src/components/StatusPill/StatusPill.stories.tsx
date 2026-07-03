import type { Meta, StoryObj } from '@storybook/react-vite';

import { BILL_STATUSES, StatusPill } from './StatusPill';

const meta = {
  title: 'Primitives/StatusPill',
  component: StatusPill,
  parameters: { layout: 'centered' },
  args: { status: 'awaiting_approval' },
} satisfies Meta<typeof StatusPill>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AwaitingApproval: Story = { args: { status: 'awaiting_approval' } };
export const MissingInfo: Story = { args: { status: 'missing_info' } };
export const Paid: Story = { args: { status: 'paid' } };
export const Rejected: Story = { args: { status: 'rejected' } };

/** The full lifecycle in one view — how status reads across the AP table. */
export const AllStates: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 420 }}>
      {BILL_STATUSES.map((status) => (
        <StatusPill key={status} status={status} />
      ))}
    </div>
  ),
};
