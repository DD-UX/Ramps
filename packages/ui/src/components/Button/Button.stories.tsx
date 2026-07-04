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

/** Transparent, limestone hover — "Options ▾" / "Save draft" (snapshots 6/9). */
export const Subtle: Story = { args: { variant: 'subtle', children: 'Options' } };

/** Dark ink fill — the submit CTA "Create bill" (snapshot 9). */
export const Ink: Story = { args: { variant: 'ink', children: 'Create bill' } };

/** Orange destructive family — never red. */
export const Destructive: Story = { args: { variant: 'destructive' } };

/** Real disabled affordance: dimmed + not-allowed, visibly distinct from base. */
export const Disabled: Story = { args: { disabled: true } };

/** Leading Lucide icon — "Save draft" with `<Save />` (snapshot 9). */
export const WithIcon: Story = {
  args: { variant: 'subtle', leadingIcon: <Save size={16} />, children: 'Save draft' },
};

/** Trailing chevron — the "New bill" dropdown trigger (snapshot 6). */
export const WithTrailingIcon: Story = {
  args: { variant: 'primary', trailingIcon: <ChevronDown size={16} />, children: 'New bill' },
};

/** Submit CTA with the ⌘↵ keyboard chip — "Create bill" (snapshot 9). */
export const WithKeyChip: Story = {
  args: { variant: 'ink', children: 'Create bill', keyChip: '⌘↵' },
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
        <Button variant="subtle" leadingIcon={<Save size={16} />}>
          Save draft
        </Button>
        <Button variant="ink" keyChip="⌘↵">
          Create bill
        </Button>
        <Button variant="destructive">Delete</Button>
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
