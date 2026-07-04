import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button/Button';
import { Banner } from './Banner';

const meta = {
  title: 'Primitives/Banner',
  component: Banner,
  parameters: { layout: 'padded' },
  args: { tone: 'info', title: 'Improved Bill Pay exports' },
} satisfies Meta<typeof Banner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    tone: 'info',
    title: 'Improved Bill Pay exports',
    description: 'Bills and payments are now exported as separate files.',
  },
};

/** The overdue banner from the payment-schedule drawer — warning + inline CTA. */
export const Overdue: Story = {
  args: {
    tone: 'warning',
    title: 'This bill is 37 days overdue',
    description: 'Get it approved by 1:00 PM for same-day delivery.',
    action: <Button variant="primary">Add same-day delivery</Button>,
    onDismiss: () => {},
  },
};

/** The blocking missing-info banner — critical is orange, never raw red. */
export const MissingInfo: Story = {
  args: {
    tone: 'critical',
    title: 'Add missing information for Culver Rug Co',
    description: 'This vendor is missing a state and a vendor contact.',
  },
};

export const Synced: Story = {
  args: { tone: 'positive', title: 'Payment synced to QuickBooks', onDismiss: () => {} },
};
