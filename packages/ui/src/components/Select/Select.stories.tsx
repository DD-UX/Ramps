import type { Meta, StoryObj } from '@storybook/react-vite';

import { Select } from './Select';

// Reference-style options standing in for synced accounting dimensions. The ✳
// glyph mirrors the accounting-dimension mark in snapshot 9.
const CATEGORIES = [
  { label: 'Office Supplies', value: 'office', glyph: '✳' },
  { label: 'Software & subscriptions', value: 'software', glyph: '✳' },
  { label: 'Inventory asset', value: 'inventory', glyph: '✳' },
  { label: 'Consulting expense', value: 'consulting', glyph: '✳' },
];

const meta = {
  title: 'Primitives/Select',
  component: Select,
  parameters: { layout: 'centered' },
  args: { options: CATEGORIES, label: 'Accounting Category' },
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

/** Filled — the label has floated to the top edge (MUI-style), value below. */
export const Filled: Story = { args: { defaultValue: 'office' } };

/** Required/invalid — destructive border, never red. */
export const Invalid: Story = { args: { invalid: true } };

/** Disabled/locked dimension. */
export const Disabled: Story = { args: { disabled: true, defaultValue: 'inventory' } };
