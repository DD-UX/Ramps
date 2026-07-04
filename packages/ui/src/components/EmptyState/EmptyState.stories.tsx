import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button/Button';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Primitives/EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
  args: {
    title: 'No bills yet',
    description: 'Upload an invoice or forward it to your Bill Pay inbox to get started.',
  },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstRun: Story = {
  args: {
    title: 'No bills yet',
    description: 'Upload an invoice or forward it to your Bill Pay inbox to get started.',
    action: <Button>Upload invoice</Button>,
  },
};

export const NoResults: Story = {
  args: {
    title: 'No bills match this filter',
    description: 'Try clearing the status filter or searching for a different vendor.',
  },
};
