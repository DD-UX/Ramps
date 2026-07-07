import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';

import { Menu } from './Menu';

const meta = {
  title: 'Primitives/Menu',
  component: Menu,
  parameters: { layout: 'centered' },
  args: {
    items: [{ label: 'Edit' }, { label: 'Duplicate' }, { label: 'Delete', tone: 'destructive' }],
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

/**
 * Boundary awareness (Popper-style flip + shift) — triggers pinned to the
 * viewport corners. An `align="end"` panel near the RIGHT edge would spill off
 * screen; instead it SHIFTS along x to stay inside (8px collision padding), and
 * near the BOTTOM it FLIPS above the trigger. Click each ⋮ to see it reframe.
 */
export const NearViewportEdge: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="relative h-screen">
      <div className="left-2 top-2 absolute">
        <Menu {...args} align="start" />
      </div>
      <div className="right-2 top-2 absolute">
        <Menu {...args} align="end" />
      </div>
      <div className="bottom-2 left-2 absolute">
        <Menu {...args} align="start" />
      </div>
      <div className="bottom-2 right-2 absolute">
        <Menu {...args} align="end" />
      </div>
    </div>
  ),
};

/**
 * Scoped reframing — the panel is clamped to a `boundary` container (the dashed
 * box) instead of the whole viewport. The ⋮ sits near the box's right edge, so
 * the `align="end"` panel SHIFTS left to stay inside the box's rect (not the
 * page's), mirroring how a Menu in the DraggablePanel's left pane is kept from
 * spilling across the split. Without `boundary` it would reframe to the window.
 */
export const WithinBoundary: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => {
    const boundary = useRef<HTMLDivElement>(null);
    return (
      <div className="p-rui-8 flex h-screen items-center justify-center">
        <div
          ref={boundary}
          className="border-bone rounded-square gap-rui-3 p-rui-4 w-80 relative flex items-center justify-end overflow-hidden border border-dashed"
        >
          <span className="text-sm font-body text-hushed">Clamped to this box</span>
          <Menu {...args} align="end" boundary={boundary} />
        </div>
      </div>
    );
  },
};
