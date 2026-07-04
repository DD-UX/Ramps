import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../Button/Button';
import { Modal } from './Modal';

const meta = {
  title: 'Primitives/Modal',
  component: Modal,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The frame-13 payment-date field: floating label, value, calendar glyph. */
function PaymentDateField() {
  return (
    <div className="flex flex-col gap-rui-1">
      <div className="flex items-center justify-between gap-rui-3 rounded-square border border-bone bg-white px-rui-3 py-rui-2">
        <div className="flex flex-col">
          <span className="text-xs text-hushed">Payment date</span>
          <span className="text-base text-ink">Feb 23, 2026</span>
        </div>
        <Calendar size={16} className="text-hushed" aria-hidden />
      </div>
      <p className="text-xs text-hushed">
        Estimated arrival on <span className="font-heading text-ink">Feb 25, 2026</span>
      </p>
    </div>
  );
}

/**
 * Frame 13, verbatim: light scrim, one white padded panel, title + ✕, hushed
 * body copy, the payment-date field, then Cancel (underline) vs the lime
 * primary. Static `open` so the gallery captures it.
 */
export const WhenToPay: Story = {
  args: { open: true, onClose: () => {} },
  render: (args) => (
    <div className="h-96">
      <Modal {...args}>
        <Modal.Header>When do you want to pay this bill?</Modal.Header>
        <Modal.Body>
          <p className="text-hushed">
            Your bank account will be debited on this day to initiate the bill payment
          </p>
          <PaymentDateField />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="underline">Cancel</Button>
          <Button variant="primary">Pay on Feb 23, 2026</Button>
        </Modal.Footer>
      </Modal>
    </div>
  ),
};

function InteractiveDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-8">
      <Button variant="ink" onClick={() => setOpen(true)}>
        Pay bill
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Modal.Header>When do you want to pay this bill?</Modal.Header>
        <Modal.Body>
          <p className="text-hushed">
            Your bank account will be debited on this day to initiate the bill payment
          </p>
          <PaymentDateField />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="underline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Pay on Feb 23, 2026
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

/** Open it yourself — dismiss via ✕, Esc, scrim click, or Cancel. */
export const Interactive: Story = {
  args: { open: false, onClose: () => {} },
  render: () => <InteractiveDemo />,
};
