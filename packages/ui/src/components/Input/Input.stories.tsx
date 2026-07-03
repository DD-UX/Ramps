import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './Input';

const meta = {
  title: 'Primitives/Input',
  component: Input,
  parameters: { layout: 'centered' },
  args: { placeholder: 'Invoice number' },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filled: Story = { args: { defaultValue: 'INV-10428' } };
export const Invalid: Story = { args: { invalid: true, defaultValue: '' , placeholder: 'State (required)' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Locked field' } };
