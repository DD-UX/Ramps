import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';

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

/** Resting field — white fill, thin bone border, near-square (snapshot 9). */
export const Default: Story = {};

/** A line-item description field with a value ("Office Chairs"). */
export const Filled: Story = { args: { placeholder: 'Description', defaultValue: 'Office Chairs' } };

/** Amount field with a `$` prefix adornment ("$12,000.00"). */
export const AmountPrefixed: Story = {
  args: { placeholder: '0.00', defaultValue: '12,000.00', leadingIcon: '$' },
};

/** Field-level required validation — destructive border, never red. */
export const Invalid: Story = {
  args: { invalid: true, defaultValue: '', placeholder: 'State (required)' },
};

/** Disabled/locked field. */
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Locked field' } };

/**
 * The toolbar search pill (snapshot 1): "Search or filter…" is the one fully
 * ROUNDED input in the frames — white fill, bone border, hushed search glyph.
 */
export const Rounded: Story = {
  args: {
    rounded: true,
    placeholder: 'Search or filter...',
    leadingIcon: <Search size={14} />,
  },
};
