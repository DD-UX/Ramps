import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from 'lucide-react';

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
      <div className="flex items-center gap-rui-2">
        <Avatar name="Staples" size="sm" />
        <span className="text-sm font-heading text-ink">Staples</span>
      </div>
      <p className="mt-rui-3 text-sm font-body text-hushed">
        Staples Inc. is an American office supply retail company headquartered in Framingham,
        Massachusetts.
      </p>
      {/* Frame 7's footer is a plain single-line text meta row — no avatar. */}
      <div className="mt-rui-3 flex items-center gap-rui-2 border-t border-bone pt-rui-3 text-xs text-hushed">
        <span>David Wallace &amp; 0 more</span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1">
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
    <div className="flex justify-center p-8 pb-56">
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
      <div className="absolute left-2 top-2">
        <Popover>
          <Popover.Trigger>
            <span className="text-sm font-heading text-ink underline decoration-dotted">
              Top left
            </span>
          </Popover.Trigger>
          <VendorCard />
        </Popover>
      </div>
      <div className="absolute right-2 top-2">
        <Popover>
          <Popover.Trigger>
            <span className="text-sm font-heading text-ink underline decoration-dotted">
              Top right
            </span>
          </Popover.Trigger>
          <VendorCard />
        </Popover>
      </div>
      <div className="absolute bottom-2 left-2">
        <Popover>
          <Popover.Trigger>
            <span className="text-sm font-heading text-ink underline decoration-dotted">
              Bottom left
            </span>
          </Popover.Trigger>
          <VendorCard />
        </Popover>
      </div>
      <div className="absolute bottom-2 right-2">
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
