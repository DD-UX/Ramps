import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from './Checkbox';

const meta = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: { id: 'cb-1', label: 'Save as default coding for future bills' },
};
export const Checked: Story = {
  args: { id: 'cb-2', label: 'ACH (Direct deposit) details', defaultChecked: true },
};
export const NoLabel: Story = { args: { id: 'cb-3', 'aria-label': 'Select row' } };
export const Disabled: Story = { args: { id: 'cb-4', label: 'Tax details (W-9)', disabled: true } };
export const DisabledChecked: Story = {
  args: { id: 'cb-5', label: 'Tax details (W-9)', disabled: true, checked: true },
};
