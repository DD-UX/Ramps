import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from 'lucide-react';
import { useRef } from 'react';

import { Avatar } from '../Avatar/Avatar';
import { Popover } from './Popover';

const meta = {
  title: 'Primitives/Popover',
  component: Popover,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The vendor card body from snapshot 7 — logo + name, blurb, meta footer. */
function VendorCard() {
  return (
    <Popover.Content>
      <div className="gap-rui-2 flex items-center">
        <Avatar name="Staples" size="sm" />
        <span className="text-sm font-heading text-ink">Staples</span>
      </div>
      <p className="mt-rui-3 text-sm font-body text-hushed">
        Staples Inc. is an American office supply retail company headquartered in Framingham,
        Massachusetts.
      </p>
      {/* Frame 7's footer is a plain single-line text meta row — no avatar. */}
      <div className="mt-rui-3 gap-rui-2 border-bone pt-rui-3 text-xs text-hushed flex items-center border-t">
        <span>David Wallace &amp; 0 more</span>
        <span aria-hidden>·</span>
        <span className="gap-1 inline-flex items-center">
          <Tag size={12} /> Legal &amp; HR
        </span>
      </div>
    </Popover.Content>
  );
}

/**
 * Open state (snapshot 7) — controlled `open` so the card is visible in the
 * gallery. Default trigger is click.
 */
export const VendorHovercard: Story = {
  render: () => (
    <div className="p-8 pb-56">
      <Popover open>
        <Popover.Trigger>
          <span className="text-sm font-heading text-ink">Staples</span>
        </Popover.Trigger>
        <VendorCard />
      </Popover>
    </div>
  ),
};

/**
 * The DEFAULT trigger — click the vendor name to pin the card open; it stays
 * until you click away or press Esc (`useClickAway`). The trigger sits
 * mid-canvas so the card has room to center under it (the gate asserts the
 * unconstrained placement here; NearViewportEdges owns the clipped cases,
 * where the card shifts off-center on purpose).
 */
export const OnClick: Story = {
  render: () => (
    <div className="p-8 pb-56 flex justify-center">
      <Popover>
        <Popover.Trigger>
          <span className="text-sm font-heading text-ink underline decoration-dotted">Staples</span>
        </Popover.Trigger>
        <VendorCard />
      </Popover>
    </div>
  ),
};

/** Hover mode — the frame-7 hovercard intent (Base UI open/close delays). */
export const OnHover: Story = {
  render: () => (
    <div className="p-8 pb-56">
      <Popover trigger="hover">
        <Popover.Trigger>
          <span className="text-sm font-heading text-ink underline decoration-dotted">Staples</span>
        </Popover.Trigger>
        <VendorCard />
      </Popover>
    </div>
  ),
};

/**
 * Boundary awareness (Popper-style flip + shift) — triggers pinned to the
 * viewport edges. The card centered under a corner trigger would clip; instead
 * it SHIFTS along x to stay inside (8px collision padding), and near the
 * bottom it FLIPS above the trigger. Click each trigger to see it.
 */
export const NearViewportEdges: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="relative h-screen">
      <div className="left-2 top-2 absolute">
        <Popover>
          <Popover.Trigger>
            <span className="text-sm font-heading text-ink underline decoration-dotted">
              Top left
            </span>
          </Popover.Trigger>
          <VendorCard />
        </Popover>
      </div>
      <div className="right-2 top-2 absolute">
        <Popover>
          <Popover.Trigger>
            <span className="text-sm font-heading text-ink underline decoration-dotted">
              Top right
            </span>
          </Popover.Trigger>
          <VendorCard />
        </Popover>
      </div>
      <div className="bottom-2 left-2 absolute">
        <Popover>
          <Popover.Trigger>
            <span className="text-sm font-heading text-ink underline decoration-dotted">
              Bottom left
            </span>
          </Popover.Trigger>
          <VendorCard />
        </Popover>
      </div>
      <div className="bottom-2 right-2 absolute">
        <Popover>
          <Popover.Trigger>
            <span className="text-sm font-heading text-ink underline decoration-dotted">
              Bottom right
            </span>
          </Popover.Trigger>
          <VendorCard />
        </Popover>
      </div>
    </div>
  ),
};

/**
 * Scoped reframing — the card is clamped to a `boundary` container (the dashed
 * box) instead of the viewport. The trigger sits at the box's right edge, so
 * the centered card SHIFTS left to stay inside the box's rect (not the page's),
 * mirroring how the approver-picker card is kept inside the bill-detail split's
 * LEFT PANE. Without `boundary` it would reframe to the window and could spill
 * across the divider. Click the trigger to see it.
 */
export const WithinBoundary: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => {
    const boundary = useRef<HTMLDivElement>(null);
    return (
      <div className="p-rui-8 flex h-screen items-center justify-center">
        <div
          ref={boundary}
          className="border-bone rounded-square p-rui-4 w-96 relative flex justify-end overflow-hidden border border-dashed"
        >
          <Popover open boundary={boundary}>
            <Popover.Trigger>
              <span className="text-sm font-heading text-ink underline decoration-dotted">
                Near the box edge
              </span>
            </Popover.Trigger>
            <VendorCard />
          </Popover>
        </div>
      </div>
    );
  },
};
