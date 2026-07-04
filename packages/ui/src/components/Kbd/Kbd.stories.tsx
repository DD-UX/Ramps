import type { Meta, StoryObj } from '@storybook/react-vite';

import { Kbd } from './Kbd';

const meta = {
  title: 'Primitives/Kbd',
  component: Kbd,
  parameters: { layout: 'centered' },
  args: { children: '⌘' },
} satisfies Meta<typeof Kbd>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A single raised keycap. */
export const Single: Story = {};

/** The ⌘ ↵ combo from the "Create bill" submit (snapshot 9) — one chip per key. */
export const CommandReturn: Story = {
  render: () => (
    <span className="inline-flex items-center gap-1">
      <Kbd>⌘</Kbd>
      <Kbd>↵</Kbd>
    </span>
  ),
};

/** On the lime primary surface — exactly the frame-9 context. */
export const OnAccent: Story = {
  render: () => (
    <span className="inline-flex items-center gap-2 bg-accent px-rui-3 py-rui-2 text-sm font-heading text-ink">
      Create bill
      <span className="inline-flex items-center gap-1">
        <Kbd>⌘</Kbd>
        <Kbd>↵</Kbd>
      </span>
    </span>
  ),
};
