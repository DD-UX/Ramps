import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from '../Card/Card';
import { DraggablePanel } from './DraggablePanel';

const meta = {
  title: 'Primitives/DraggablePanel',
  component: DraggablePanel,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ height: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DraggablePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The bill-detail split (snapshot 8): coding form left, invoice preview right. */
export const BillDetail: Story = {
  args: {
    left: (
      <div className="h-full p-rui-4">
        <Card elevation="flat">
          <Card.Header>Payment details</Card.Header>
          <Card.Body>
            <p className="text-sm text-hushed">
              ACH (Direct deposit) · Thread Bank (···· 4029) · schedule later
            </p>
          </Card.Body>
        </Card>
      </div>
    ),
    right: (
      <div className="flex h-full items-center justify-center bg-limestone p-rui-4">
        <div className="rounded-square bg-white p-rui-6 text-center shadow-card">
          <p className="text-sm font-heading text-ink">INVOICE</p>
          <p className="mt-1 text-xs text-hushed">Clarity Online · $262.50</p>
        </div>
      </div>
    ),
  },
};

/** Narrow left pane clamped near the minimum. */
export const WideRight: Story = {
  args: { ...BillDetail.args, defaultSplit: 30 } as Story['args'],
};
