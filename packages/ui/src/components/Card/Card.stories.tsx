import type { Meta, StoryObj } from '@storybook/react-vite';
import { Check, FileText, HelpCircle, ThumbsDown, ThumbsUp } from 'lucide-react';

import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Tooltip } from '../Tooltip/Tooltip';
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

/** The frame-8 checklist — the third row carries the source-document chip. */
const CHECKS: ReadonlyArray<{ text: string; docs?: number }> = [
  { text: 'Coding appears consistent with bill memo, line item descriptions, and similar bills' },
  { text: 'Memo and line items clearly state the bill contents' },
  { text: 'Bill amount is similar to recent W.B. Mason bills.', docs: 1 },
  { text: 'All expected line item categories are present' },
  { text: 'Payment is scheduled to arrive on time' },
  { text: 'Payment method matches previous bills' },
];

/**
 * The signature "Ready to approve" panel (snapshot 8): ONE white padded
 * surface — no divider under the title — pale positive border, wide soft
 * green **glow**, the green title with its green "?" hint (tooltip explains
 * the agent), thumbs up/down on the right, the vendor rendered as a neutral
 * inline chip, the gap-spaced passed-checks list with a doc-count chip on the
 * amount check, and the "Show less" underline link closing the card.
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
        {/* Frame 8: the title AND its "?" hint are the same positive green,
            a step larger than body copy. The tooltip carries the "how". */}
        <span className="inline-flex items-center gap-1.5 text-base text-tone-positive-on">
          Ready to approve
          <Tooltip label="Ramp's agent checked this bill's coding, amount and timing against similar bills.">
            <HelpCircle size={14} className="cursor-help" />
          </Tooltip>
        </span>
      </Card.Header>
      <Card.Body className="flex flex-col gap-rui-3 text-sm text-ink">
        <p>
          This $6,442.46 bill for{' '}
          <Badge tone="neutral" className="text-sm">
            W.B. Mason
          </Badge>{' '}
          is for office supplies for the Boston office for December.
        </p>
        <div className="flex flex-col gap-1">
          <p className="font-heading">Checks passed:</p>
          <ul className="flex flex-col gap-1">
            {CHECKS.map(({ text, docs }) => (
              <li key={text} className="flex items-start gap-rui-2">
                {/* h-5 box matches the text-sm 20px line so the check pins to line one. */}
                <span className="flex h-5 shrink-0 items-center" aria-hidden>
                  <Check size={14} className="text-tone-positive-on" />
                </span>
                <span>
                  {text}
                  {docs !== undefined && (
                    // Same neutral chip treatment as the "Optional" badge —
                    // gray surface, ink text, no white fill or key shadow.
                    <Badge
                      tone="neutral"
                      icon={<FileText size={12} />}
                      className="ml-rui-2 align-middle"
                    >
                      {docs}
                    </Badge>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Button variant="underline" className="self-start">
          Show less
        </Button>
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
