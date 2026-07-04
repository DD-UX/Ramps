import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from './Badge';

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  args: { children: 'Optional', tone: 'neutral', variant: 'subtle' },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Optional: Story = { args: { children: 'Optional', tone: 'neutral' } };
export const CodedByRamp: Story = { args: { children: 'Coded by Ramp', tone: 'accent' } };
export const Recommended: Story = { args: { children: 'Recommended', tone: 'positive' } };
export const New: Story = { args: { children: 'New', tone: 'info', variant: 'solid' } };

/** The metadata vocabulary — provenance, counts and callouts, never lifecycle. */
export const Catalogue: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 460 }}>
      <Badge tone="neutral">Optional</Badge>
      <Badge tone="accent">Coded by Ramp</Badge>
      <Badge tone="positive">Recommended</Badge>
      <Badge tone="info" variant="solid">
        New
      </Badge>
      <Badge tone="neutral">Batched</Badge>
      <Badge tone="warning">Imported · Feb 3, 2025</Badge>
      <Badge tone="critical" variant="solid">
        Overdue
      </Badge>
      <Badge tone="info">Needs review (2)</Badge>
    </div>
  ),
};
