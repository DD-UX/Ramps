import type { Meta, StoryObj } from '@storybook/react-vite';

import { Select } from './Select';

// Standard bill-detail field options (does-ramp-live-up §06 "State (required)").
// Rich, glyphed option rows live in Dropdown, not here.
const STATES = [
  { label: 'California', value: 'CA' },
  { label: 'New York', value: 'NY' },
  { label: 'Texas', value: 'TX' },
  { label: 'Washington', value: 'WA' },
];

const meta = {
  title: 'Primitives/Select',
  component: Select,
  parameters: { layout: 'centered' },
  args: { options: STATES, label: 'State (required)' },
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

/** Empty — label sits centred as a placeholder. */
export const Default: Story = {};

/** Filled — the label has floated to the top edge, value below. */
export const Filled: Story = { args: { defaultValue: 'WA' } };

/** Required/invalid — destructive border, never red. */
export const Invalid: Story = { args: { invalid: true } };

/** Disabled/locked field. */
export const Disabled: Story = { args: { disabled: true, defaultValue: 'CA' } };
