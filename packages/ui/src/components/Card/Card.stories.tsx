import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../Badge/Badge';
import { Card } from './Card';

const meta = {
  title: 'Primitives/Card',
  component: Card,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A form section in the bill-detail drawer. */
export const Section: Story = {
  render: () => (
    <Card className="max-w-md">
      <Card.Header action={<Badge tone="neutral">Optional</Badge>}>Payment details</Card.Header>
      <Card.Body>
        <p className="text-sm text-hushed">
          ACH (Direct deposit) · Thread Bank (···· 4029) · Feb 23, 2026
        </p>
      </Card.Body>
    </Card>
  ),
};

/** The approval recommendation card — tone carries the verdict. */
export const ReadyToApprove: Story = {
  render: () => (
    <Card tone="positive" className="max-w-md">
      <Card.Header action={<Badge tone="positive">Ready to approve</Badge>}>
        Approval checks
      </Card.Header>
      <Card.Body>
        <ul className="space-y-1 text-sm text-ink">
          <li>✓ Vendor verified</li>
          <li>✓ Amount within policy</li>
          <li>✓ No duplicate detected</li>
        </ul>
      </Card.Body>
    </Card>
  ),
};

export const ReviewRecommended: Story = {
  render: () => (
    <Card tone="warning" className="max-w-md">
      <Card.Header action={<Badge tone="warning">Review recommended</Badge>}>
        Approval checks
      </Card.Header>
      <Card.Body>
        <p className="text-sm text-ink">This draft may be a duplicate of INV# 4072.</p>
      </Card.Body>
    </Card>
  ),
};
