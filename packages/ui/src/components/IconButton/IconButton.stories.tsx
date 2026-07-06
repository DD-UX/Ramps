import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconButton } from './IconButton';

/** Inline glyphs kept dependency-free so the kit doesn't pin an icon library. */
const DotsIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <circle cx="8" cy="3" r="1.4" />
    <circle cx="8" cy="8" r="1.4" />
    <circle cx="8" cy="13" r="1.4" />
  </svg>
);

const DownloadIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden
  >
    <path d="M8 2v8m0 0 3-3m-3 3L5 7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.5 11.5v1a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1" strokeLinecap="round" />
  </svg>
);

const meta = {
  title: 'Primitives/IconButton',
  component: IconButton,
  parameters: { layout: 'centered' },
  args: { label: 'More actions', icon: DotsIcon, variant: 'ghost', size: 'md' },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ghost: Story = { args: { label: 'More actions', icon: DotsIcon } };
export const Subtle: Story = {
  args: { label: 'Download invoice', icon: DownloadIcon, variant: 'subtle' },
};

/** Outline — white + bone border (the Bill Pay toolbar circles, …/snapshots/04). */
export const Outline: Story = {
  args: { label: 'Filter by date', icon: DownloadIcon, variant: 'outline', rounded: true },
};
export const Small: Story = { args: { label: 'More actions', icon: DotsIcon, size: 'sm' } };

/** Pill shape — same `rounded` contract as Button (the frame-1 toolbar treatment). */
export const Rounded: Story = {
  args: { label: 'More actions', icon: DotsIcon, variant: 'subtle', rounded: true },
};

/** The row toolbar vocabulary: quiet ghost controls, the three-dot overflow last. */
export const RowToolbar: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <IconButton label="Download invoice" icon={DownloadIcon} />
      <IconButton label="More actions" icon={DotsIcon} />
    </div>
  ),
};
