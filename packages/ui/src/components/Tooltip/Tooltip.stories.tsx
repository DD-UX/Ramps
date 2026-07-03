import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button/Button';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OnButton: Story = {
  args: {
    label: 'Approve to unlock payment',
    children: <Button variant="secondary">Pay now</Button>,
  },
};

export const RegulatoryWhy: Story = {
  args: {
    label: 'Ramp needs the vendor location to pay this bill (regulatory).',
    children: <span className="underline decoration-dotted">State (required)</span>,
  },
};
