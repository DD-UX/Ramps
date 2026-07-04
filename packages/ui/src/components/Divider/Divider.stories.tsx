import type { Meta, StoryObj } from '@storybook/react-vite';

import { Divider } from './Divider';

const meta = {
  title: 'Primitives/Divider',
  component: Divider,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Divider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <p className="pb-rui-3 text-sm text-ink">Bill details</p>
      <Divider />
      <p className="pt-rui-3 text-sm text-ink">Payment details</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 24 }}>
      <span className="text-sm text-ink">Edit</span>
      <Divider orientation="vertical" />
      <span className="text-sm text-ink">Duplicate</span>
      <Divider orientation="vertical" />
      <span className="text-sm text-destructive">Delete</span>
    </div>
  ),
};
