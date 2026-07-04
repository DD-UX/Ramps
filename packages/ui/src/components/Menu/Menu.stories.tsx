import type { Meta, StoryObj } from '@storybook/react-vite';

import { Menu } from './Menu';

const meta = {
  title: 'Primitives/Menu',
  component: Menu,
  parameters: { layout: 'centered' },
  args: {
    items: [
      { label: 'Edit' },
      { label: 'Duplicate' },
      { label: 'Delete', tone: 'destructive' },
    ],
  },
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RowOverflow: Story = {};

/** `rounded` flows into the built-in overflow IconButton — the toolbar-pill trigger. */
export const RoundedTrigger: Story = { args: { rounded: true } };

export const BillActions: Story = {
  args: {
    items: [
      { label: 'Pay now' },
      { label: 'Mark as paid' },
      { label: 'Edit bill' },
      { label: 'Remove', tone: 'destructive' },
    ],
  },
};

export const WithDisabled: Story = {
  args: {
    items: [
      { label: 'Approve' },
      { label: 'Send back', disabled: true },
      { label: 'Reject', tone: 'destructive' },
    ],
  },
};
