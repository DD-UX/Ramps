import type { Meta, StoryObj } from '@storybook/react-vite';
import { HelpCircle, ThumbsDown, ThumbsUp } from 'lucide-react';

import { Badge } from '../Badge/Badge';
import { IconButton } from '../IconButton/IconButton';
import { Card } from './Card';

const meta = {
  title: 'Primitives/Card',
  component: Card,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A resting form section in the bill-detail drawer — white, soft card shadow. */
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

/**
 * The signature "Ready to approve" panel (snapshot 8): white surface, positive
 * tinted border, soft green **glow**, thumbs up/down on the header, and the
 * passed-checks list.
 */
export const Glow: Story = {
  render: () => (
    <Card tone="positive" elevation="glow" className="max-w-lg">
      <Card.Header
        action={
          <div className="flex items-center gap-1">
            <IconButton label="Approve" icon={<ThumbsUp size={16} />} />
            <IconButton label="Reject" icon={<ThumbsDown size={16} />} />
          </div>
        }
      >
        <span className="inline-flex items-center gap-1.5">
          Ready to approve
          <HelpCircle size={14} className="text-hushed" />
        </span>
      </Card.Header>
      <Card.Body>
        <p className="mb-3 text-sm text-ink">
          This $6,442.46 bill for <span className="font-heading">W.B. Mason</span> is for office
          supplies for the Boston office for December.
        </p>
        <p className="mb-1 text-sm font-heading text-ink">Checks passed:</p>
        <ul className="space-y-1 text-sm text-ink">
          <li>✓ Coding appears consistent with bill memo and similar bills</li>
          <li>✓ Memo and line items clearly state the bill contents</li>
          <li>✓ Bill amount is similar to recent W.B. Mason bills</li>
          <li>✓ All expected line item categories are present</li>
          <li>✓ Payment is scheduled to arrive on time</li>
        </ul>
      </Card.Body>
    </Card>
  ),
};

/** Review-recommended — warning tint, resting card elevation. */
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
