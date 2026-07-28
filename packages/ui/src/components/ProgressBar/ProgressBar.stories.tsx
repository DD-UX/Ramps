import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../Button/Button';
import { ProgressBar } from './ProgressBar';

const meta = {
  title: 'Primitives/ProgressBar',
  component: ProgressBar,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-[40rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Active — the sweep the app shows while a tab, search or page re-queries.
 * The segment is ELECTRIC, the DraggablePanel divider's live-drag blue — the
 * kit's one "in motion" colour, so every busy surface speaks it.
 */
export const Active: Story = {
  args: { active: true, delayMs: 0 },
};

/**
 * At rest the rail is INVISIBLE but still occupies its 2px. That is the whole
 * point: the row of content below it must not move when loading starts. Toggle
 * the story above and below this one — nothing shifts.
 */
export const Idle: Story = {
  args: { active: false },
};

/**
 * In place — the rail as the app uses it: pinned between the filter strip and
 * the table, spanning the full content width, so the sweep reads as "this
 * region is refreshing" rather than "this control is busy".
 */
export const BetweenToolbarAndTable: Story = {
  args: { active: true, delayMs: 0 },
  render: (args) => (
    <div className="border-bone rounded-square overflow-hidden border">
      <div className="px-rui-4 py-rui-3 bg-stone-50 text-sm font-body text-hushed">
        Filters · Status · Options
      </div>
      <ProgressBar {...args} />
      <div className="divide-bone bg-white divide-y">
        {['Anderson Legal', 'Northwind Supply', 'Vertex Cloud'].map((name) => (
          <div key={name} className="px-rui-4 py-rui-3 text-sm font-body text-ink">
            {name}
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * The anti-flash contract, demonstrated. "Instant work" flips `active` for 50ms
 * — under `delayMs`, so the rail never appears at all. "Slow work" holds it for
 * 1.5s. A rail that strobes on every fast response is worse than no rail, which
 * is why the primitive owns the timing instead of the caller.
 */
export const DoesNotFlashOnFastWork: Story = {
  args: { active: false },
  render: () => {
    const [active, setActive] = useState(false);
    const run = (ms: number) => {
      setActive(true);
      setTimeout(() => setActive(false), ms);
    };
    return (
      <div className="gap-rui-4 flex flex-col">
        <ProgressBar active={active} />
        <div className="gap-rui-2 flex">
          <Button variant="secondary" onClick={() => run(50)}>
            Instant work (50ms)
          </Button>
          <Button variant="secondary" onClick={() => run(1500)}>
            Slow work (1.5s)
          </Button>
        </div>
      </div>
    );
  },
};
