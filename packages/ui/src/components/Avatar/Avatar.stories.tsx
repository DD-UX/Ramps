import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from './Avatar';

const meta = {
  title: 'Primitives/Avatar',
  component: Avatar,
  parameters: { layout: 'centered' },
  args: { name: 'Culver Rug Co', size: 'md' },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Monogram: Story = { args: { name: 'Culver Rug Co' } };
export const SingleWord: Story = { args: { name: 'Ziply' } };
export const Small: Story = { args: { name: 'Berroco Inc', size: 'sm' } };
export const Large: Story = { args: { name: 'Clarity Online', size: 'lg' } };

/** The AP-table cast — deterministic tints keep each vendor visually stable. */
export const VendorRow: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      {['Culver Rug Co', 'Berroco, Inc.', 'Ziply Fiber', 'Clarity Online', 'Acme Supply'].map(
        (name) => (
          <Avatar key={name} name={name} />
        ),
      )}
    </div>
  ),
};
