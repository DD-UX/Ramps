import type { Meta, StoryObj } from '@storybook/react-vite';
import { Check, ChevronDown, Plus, Save } from 'lucide-react';

import { Button } from './Button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  parameters: { layout: 'centered' },
  args: { children: 'Pay bill' },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Accent lime + ink — the "New bill" CTA (snapshot 6). */
export const Primary: Story = { args: { variant: 'primary' } };

/** White + bone border — the row "Approve" buttons (snapshot 6). */
export const Secondary: Story = { args: { variant: 'secondary', children: 'Approve' } };

/** Transparent, limestone hover — "Options ▾" (snapshot 6). */
export const Subtle: Story = { args: { variant: 'subtle', children: 'Options' } };

/** Dark ink fill — the high-emphasis dark submit. */
export const Ink: Story = { args: { variant: 'ink' } };

/** Orange destructive family — never red. */
export const Destructive: Story = { args: { variant: 'destructive' } };

/** Real disabled affordance: dimmed + not-allowed, visibly distinct from base. */
export const Disabled: Story = { args: { disabled: true } };

/**
 * The underline link action — "Save draft" (snapshot 9 at 6x): floppy-disk
 * icon + underlined ink label, no fill, no border. Frame 8's "Show less"
 * is the same variant without the icon.
 */
export const Underline: Story = {
  args: { variant: 'underline', leadingIcon: <Save size={16} />, children: 'Save draft' },
};

/**
 * The toolbar pill (snapshot 1): "Options ▾" is a fully ROUNDED white
 * secondary — the only rounded button in the frames; the lime "New bill"
 * beside it stays square.
 */
export const Rounded: Story = {
  args: {
    variant: 'secondary',
    rounded: true,
    trailingIcon: <ChevronDown size={16} />,
    children: 'Options',
  },
};

/** Leading icon — the "+ New bill" lime CTA (snapshot 1). */
export const WithIcon: Story = {
  args: { variant: 'primary', leadingIcon: <Plus size={16} />, children: 'New bill' },
};

/** Trailing chevron — the "New bill" dropdown trigger (snapshot 6). */
export const WithTrailingIcon: Story = {
  args: { variant: 'primary', trailingIcon: <ChevronDown size={16} />, children: 'New bill' },
};

/**
 * The submit CTA "Create bill" (snapshot 9 at 6x): LIME primary with two
 * separate raised keycaps — ⌘ then ↵ — one `Kbd` chip per key.
 */
export const WithKeys: Story = {
  args: { variant: 'primary', children: 'Create bill', keys: ['⌘', '↵'] },
};

/** In-flight action: spinner replaces the leading icon, button disables. */
export const Loading: Story = { args: { variant: 'primary', loading: true } };

/** Compact row action. */
export const Small: Story = {
  args: { size: 'sm', variant: 'secondary', leadingIcon: <Check size={14} />, children: 'Approve' },
};

/** The full matrix, side by side, for a reviewer's eyeball. */
export const Catalogue: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="primary" trailingIcon={<ChevronDown size={16} />}>
          New bill
        </Button>
        <Button variant="secondary">Approve</Button>
        <Button variant="underline" leadingIcon={<Save size={16} />}>
          Save draft
        </Button>
        <Button variant="primary" keys={['⌘', '↵']}>
          Create bill
        </Button>
        <Button variant="ink">Pay bill</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="secondary" rounded trailingIcon={<ChevronDown size={16} />}>
          Options
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" disabled leadingIcon={<Plus size={16} />}>
          New bill
        </Button>
        <Button variant="secondary" loading>
          Approve
        </Button>
        <Button size="sm" variant="secondary" leadingIcon={<Check size={14} />}>
          Approve
        </Button>
      </div>
    </div>
  ),
};
