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
      <div className="p-rui-4 h-full">
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
      <div className="bg-limestone p-rui-4 flex h-full items-center justify-center">
        <div className="rounded-square bg-white p-rui-6 shadow-card text-center">
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

/**
 * Full-height, independent scrolling — the real bill-detail behaviour. The panel
 * fills the viewport; each pane overflows with its own long content and scrolls
 * on its own. Scroll the left form all the way down and the right invoice stays
 * put (and vice versa); the grip stays centered and visible the whole time.
 */
export const FullHeight: Story = {
  parameters: { layout: 'fullscreen' },
  // A viewport-tall parent so the panes have a bounded height to scroll within.
  decorators: [
    (Story) => (
      <div className="bg-limestone p-rui-4 h-screen">
        <Story />
      </div>
    ),
  ],
  args: {
    left: (
      <div className="p-rui-4 gap-rui-3 flex flex-col">
        <p className="text-sm font-heading text-ink">Bill coding</p>
        {Array.from({ length: 24 }, (_, i) => (
          <Card key={i} elevation="flat">
            <Card.Header>Line item {i + 1}</Card.Header>
            <Card.Body>
              <p className="text-sm text-hushed">
                GL 6000 · Software · ${((i + 1) * 42).toLocaleString()}.00 — memo for the coded
                line, long enough to prove the left pane scrolls on its own.
              </p>
            </Card.Body>
          </Card>
        ))}
      </div>
    ),
    right: (
      <div className="p-rui-4 gap-rui-3 flex flex-col">
        <p className="text-sm font-heading text-ink">Invoice preview</p>
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} className="rounded-square bg-white p-rui-4 shadow-card">
            <p className="text-sm font-heading text-ink">Page {i + 1}</p>
            <p className="mt-1 text-xs text-hushed">
              Clarity Online · invoice sheet {i + 1} of 30 — the preview canvas scrolls
              independently of the coding form on the left.
            </p>
          </div>
        ))}
      </div>
    ),
  },
};
