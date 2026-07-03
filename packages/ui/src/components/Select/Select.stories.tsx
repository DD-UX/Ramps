import type { Meta, StoryObj } from '@storybook/react-vite';

import { Select } from './Select';

// Reference-style options standing in for synced accounting dimensions.
const GL_ACCOUNTS = [
  { label: '6000 · Consulting expense', value: '6000' },
  { label: '6200 · Software & subscriptions', value: '6200' },
  { label: '1400 · Inventory asset', value: '1400' },
];

const meta = {
  title: 'Primitives/Select',
  component: Select,
  parameters: { layout: 'centered' },
  args: { options: GL_ACCOUNTS, placeholder: 'QuickBooks Category' },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { defaultValue: '1400', placeholder: undefined } };
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true } };
