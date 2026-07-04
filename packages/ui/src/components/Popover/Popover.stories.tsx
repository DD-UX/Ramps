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

/** The vendor hovercard body from snapshot 7 — logo + name, blurb, meta footer. */
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
      <div className="mt-rui-3 flex items-center gap-rui-2 border-t border-bone pt-rui-3 text-xs text-hushed">
        <Avatar name="David Wallace" size="sm" />
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
 * gallery. In the app it opens on hover/focus of the vendor name.
 */
export const VendorHovercard: Story = {
  render: () => (
    <div className="p-8">
      <Popover open>
        <Popover.Trigger>
          <span className="text-sm font-heading text-ink">Staples</span>
        </Popover.Trigger>
        <VendorCard />
      </Popover>
    </div>
  ),
};

/** Interactive — hover the vendor name to reveal the card (Base UI intent). */
export const OnHover: Story = {
  render: () => (
    <div className="p-8">
      <Popover>
        <Popover.Trigger>
          <span className="text-sm font-heading text-ink underline decoration-dotted">Staples</span>
        </Popover.Trigger>
        <VendorCard />
      </Popover>
    </div>
  ),
};
