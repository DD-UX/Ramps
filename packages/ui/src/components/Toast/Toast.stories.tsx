import type { Meta, StoryObj } from '@storybook/react-vite';

import { Toast } from './Toast';

const meta = {
  title: 'Primitives/Toast',
  component: Toast,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The signature upload toast (snapshot 3): white card, spinner + title, × dismiss. */
export const Uploading: Story = {
  args: { title: 'Uploading 3 invoices', loading: true, onDismiss: () => {} },
};

/** Success — positive check icon, arrival copy. */
export const PaymentScheduled: Story = {
  args: {
    title: 'Payment scheduled',
    description: 'Arrives in 2 business days',
    tone: 'positive',
    onDismiss: () => {},
  },
};

/** Failure — critical (orange, never red), retry hint. */
export const PaymentFailed: Story = {
  args: {
    title: 'Payment failed',
    description: 'Insufficient funds — retry from the drawer',
    tone: 'critical',
    onDismiss: () => {},
  },
};
