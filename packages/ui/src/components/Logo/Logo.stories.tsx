import type { Meta, StoryObj } from '@storybook/react-vite';

import { Logo } from './Logo';

const meta = {
  title: 'Primitives/Logo',
  component: Logo,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Logo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The default 2:1 lockup — two Ramp marks, ink on white. */
export const Default: Story = {};

/**
 * On limestone — the mark's home in the product: the SideMenu's top-left
 * corner (product-overview/01, x14-28 y12-26 over the #f1f0ec nav).
 */
export const OnLimestone: Story = {
  render: () => (
    <div className="bg-limestone p-rui-4 inline-flex">
      <Logo />
    </div>
  ),
};

/** Scales cleanly — the lockup stays 2:1 at any size. */
export const Sizes: Story = {
  render: () => (
    <div className="gap-rui-4 flex items-end">
      <Logo size={12} />
      <Logo size={16} />
      <Logo size={24} />
      <Logo size={40} />
    </div>
  ),
};

/**
 * Inverted — `currentColor` fills mean any token color restyles the mark
 * (limestone on ink here); the paths never change.
 */
export const Inverted: Story = {
  render: () => (
    <div className="bg-ink p-rui-4 inline-flex">
      <Logo className="text-limestone" size={24} />
    </div>
  ),
};
