import type { Meta, StoryObj } from '@storybook/react-vite';

import { Skeleton, SkeletonRow } from './Skeleton';

const meta = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Line: Story = { args: { className: 'h-3 w-48' } };
export const Circle: Story = { args: { circle: true, className: 'size-10' } };

/** The "Processing 1 document" row from the bulk-upload flow. */
export const ProcessingRow: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 420 }} className="rounded-surface border border-bone bg-limestone">
      <SkeletonRow />
      <SkeletonRow />
    </div>
  ),
};
