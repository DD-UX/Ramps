import type { Meta, StoryObj } from '@storybook/react-vite';

import { FieldInput } from './FieldInput';

const meta = {
  title: 'Primitives/FieldInput',
  component: FieldInput,
  parameters: { layout: 'centered' },
  args: { label: 'Invoice number' },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FieldInput>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Empty — the label sits centred as a placeholder. */
export const Default: Story = {};

/** Filled — the label has floated to the top edge, value below. */
export const Filled: Story = { args: { defaultValue: 'INV-2043' } };

/**
 * Date — the bill-details "Payment date" field. A native `type="date"` input, so
 * the label floats on focus too (the native `mm/dd/yyyy` text would otherwise
 * collide with the centred label).
 */
export const Date: Story = { args: { label: 'Payment date', type: 'date' } };

/** Date, pre-filled — label already floated, value shown beneath. */
export const DateFilled: Story = {
  args: { label: 'Payment date', type: 'date', defaultValue: '2026-07-06' },
};

/** Required/invalid — destructive border, never red. */
export const Invalid: Story = { args: { invalid: true } };

/**
 * A single validation error beneath the field — pass the react-hook-form
 * `fieldState.error?.message` string straight in. The message drives the
 * destructive frame on its own.
 */
export const WithError: Story = {
  args: { defaultValue: 'INV-99', errors: 'Invoice number must be at least 8 characters.' },
};

/**
 * Multiple errors (e.g. a zod `flatten().fieldErrors[name]` `string[]`) — one
 * line each, announced together as a single `role="alert"` group.
 */
export const WithErrors: Story = {
  args: {
    defaultValue: 'inv 1',
    errors: [
      'Invoice number must be at least 8 characters.',
      'Invoice number cannot contain spaces.',
    ],
  },
};

/** Disabled/locked field. */
export const Disabled: Story = { args: { disabled: true, defaultValue: 'INV-2043' } };
