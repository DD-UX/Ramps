import type { Meta, StoryObj } from '@storybook/react-vite';

import { UserAvatars } from './UserAvatars';

const APPROVERS = [
  { name: 'Hannah Smolinski' },
  { name: 'David Wallace' },
  { name: 'Michael Scott' },
  { name: 'Angela Martin' },
  { name: 'Oscar Martinez' },
  { name: 'Kevin Malone' },
];

const meta = {
  title: 'Primitives/UserAvatars',
  component: UserAvatars,
  parameters: { layout: 'centered' },
  args: { people: APPROVERS },
} satisfies Meta<typeof UserAvatars>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The approval chain (snapshot 10) — overlapping approvers, "+N" overflow. */
export const ApprovalChain: Story = {};

/** A short pair — no overflow chip. */
export const Pair: Story = {
  args: { people: APPROVERS.slice(0, 2) },
};

/** Small size for dense table rows. */
export const Small: Story = {
  args: { size: 'sm', max: 3 },
};
