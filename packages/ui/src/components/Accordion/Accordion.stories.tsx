import type { Meta, StoryObj } from '@storybook/react-vite';

import { Accordion, AccordionItem } from './Accordion';

const meta = {
  title: 'Primitives/Accordion',
  component: Accordion,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The vetted row from snapshot 13, open by default like the frame. */
export const PayWithRampCard: Story = {
  args: { children: null },
  render: () => (
    <div style={{ width: 520 }}>
      <Accordion>
        <AccordionItem
          title="Pay with Ramp Card · Pay automatically"
          subtitle="Create a single-use virtual card number you can use for this bill"
          defaultOpen
        >
          <p className="text-sm text-hushed">
            The card locks to this bill&apos;s total after the first charge.
          </p>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

/** A stack — each row keeps its own state; hairlines separate the rows. */
export const MultipleItems: Story = {
  args: { children: null },
  render: () => (
    <div style={{ width: 520 }}>
      <Accordion>
        <AccordionItem
          title="Pay with Ramp Card · Pay automatically"
          subtitle="Create a single-use virtual card number you can use for this bill"
        >
          <p className="text-sm text-hushed">
            The card locks to this bill&apos;s total after the first charge.
          </p>
        </AccordionItem>
        <AccordionItem title="Payment details" subtitle="ACH · arrives in 2 business days">
          <p className="text-sm text-hushed">
            We&apos;ll debit your Checking ···4021 on the scheduled date.
          </p>
        </AccordionItem>
        <AccordionItem title="Approvals" subtitle="Any Admin can approve">
          <p className="text-sm text-hushed">3 approvers are eligible for this bill.</p>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
