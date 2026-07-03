import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Tabs } from './Tabs';

const LIFECYCLE = [
  { value: 'overview', label: 'Overview' },
  { value: 'drafts', label: 'Drafts', count: 4 },
  { value: 'for_approval', label: 'For approval', count: 2 },
  { value: 'for_payment', label: 'For payment', count: 7 },
  { value: 'history', label: 'History' },
];

const meta = {
  title: 'Primitives/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledTabs({ initial = 'for_approval' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <Tabs tabs={LIFECYCLE} value={value} onValueChange={setValue} />;
}

export const BillLifecycle: Story = {
  render: () => <ControlledTabs />,
};

export const OverviewActive: Story = {
  render: () => <ControlledTabs initial="overview" />,
};
