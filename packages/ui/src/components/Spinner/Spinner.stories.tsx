import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button/Button';
import { Spinner } from './Spinner';

const meta = {
  title: 'Primitives/Spinner',
  component: Spinner,
  parameters: { layout: 'centered' },
  args: { size: 'md' },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Medium: Story = { args: { size: 'md', label: 'Loading' } };
export const Small: Story = { args: { size: 'sm', label: 'Loading' } };

/** Inherits currentColor — ink on the button surface. */
export const InButton: StoryObj = {
  render: () => (
    <Button className="gap-rui-2">
      <Spinner size="sm" />
      Processing…
    </Button>
  ),
};
