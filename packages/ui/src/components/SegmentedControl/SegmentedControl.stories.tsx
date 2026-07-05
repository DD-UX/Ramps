import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { SegmentedControl } from './SegmentedControl';

const meta = {
  title: 'Primitives/SegmentedControl',
  component: SegmentedControl,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof SegmentedControl>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Stateful demo extracted as a component (lint: no hooks in render functions). */
function ControlledDemo({
  options,
  initial,
}: {
  options: Array<{ value: string; label: string }>;
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div style={{ width: 480 }}>
      <SegmentedControl options={options} value={value} onValueChange={setValue} />
    </div>
  );
}

/** The vetted pair from snapshot 12 — click across to watch the plate glide. */
export const PayByCard: Story = {
  args: {
    options: [
      { value: 'new', label: 'New card' },
      { value: 'existing', label: 'Existing card' },
    ],
    value: 'new',
  },
  render: () => (
    <ControlledDemo
      options={[
        { value: 'new', label: 'New card' },
        { value: 'existing', label: 'Existing card' },
      ]}
      initial="new"
    />
  ),
};

/** 2..n options — the grid splits evenly, the ONE plate serves them all. */
export const ThreeOptions: Story = {
  args: {
    options: [
      { value: 'ach', label: 'ACH' },
      { value: 'check', label: 'Check' },
      { value: 'wire', label: 'Wire' },
    ],
    value: 'ach',
  },
  render: () => (
    <ControlledDemo
      options={[
        { value: 'ach', label: 'ACH' },
        { value: 'check', label: 'Check' },
        { value: 'wire', label: 'Wire' },
      ]}
      initial="ach"
    />
  ),
};
