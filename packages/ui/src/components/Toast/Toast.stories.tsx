import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimatePresence } from 'motion/react';
import { useState } from 'react';

import { Button } from '../Button/Button';
import { Toast, TOAST_VARIANTS, type ToastVariantName } from './Toast';

const meta = {
  title: 'Primitives/Toast',
  component: Toast,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The signature upload toast (snapshot 3): white card, spinner + title, × dismiss. */
export const Uploading: Story = {
  args: { title: 'Uploading 3 invoices', loading: true, onDismiss: () => {} },
};

/** Success — positive check icon, arrival copy. */
export const PaymentScheduled: Story = {
  args: {
    title: 'Payment scheduled',
    description: 'Arrives in 2 business days',
    tone: 'positive',
    onDismiss: () => {},
  },
};

/** Failure — critical (orange, never red), retry hint. */
export const PaymentFailed: Story = {
  args: {
    title: 'Payment failed',
    description: 'Insufficient funds — retry from the drawer',
    tone: 'critical',
    onDismiss: () => {},
  },
};

/**
 * The spread-a-preset API from the docs: `transition={TOAST_VARIANTS.slideBottomRight}`
 * — the toast slides in from the bottom-right on mount.
 */
export const SlideBottomRight: Story = {
  args: {
    title: 'Payment scheduled',
    description: 'Arrives in 2 business days',
    tone: 'positive',
    onDismiss: () => {},
    transition: TOAST_VARIANTS.slideBottomRight,
  },
};

/** Preset picker laid out like the screen — 3×3, matching each preset's home corner. */
const PRESET_GRID: ReadonlyArray<ReadonlyArray<ToastVariantName>> = [
  ['slideTopLeft', 'slideTop', 'slideTopRight'],
  ['slideLeft', 'popCenter', 'slideRight'],
  ['slideBottomLeft', 'slideBottom', 'slideBottomRight'],
];

/**
 * Stateful demo extracted as a component (lint: no hooks in render functions).
 * `key={preset + seq}` remounts the toast so the enter phase replays, and
 * `AnimatePresence` lets the exit phase play when it's dismissed or swapped.
 */
function AnimatedDemo() {
  const [preset, setPreset] = useState<ToastVariantName>('slideBottomRight');
  const [seq, setSeq] = useState(0);
  const [shown, setShown] = useState(true);

  return (
    <div className="flex w-[340px] flex-col items-center gap-rui-6">
      <div className="grid grid-cols-3 gap-rui-2">
        {PRESET_GRID.flat().map((name) => (
          <Button
            key={name}
            variant={name === preset ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setPreset(name);
              setSeq((n) => n + 1);
              setShown(true);
            }}
          >
            {name}
          </Button>
        ))}
      </div>
      <div className="flex h-20 w-full items-center">
        <AnimatePresence>
          {shown && (
            <Toast
              key={`${preset}-${seq}`}
              title="Payment scheduled"
              description="Arrives in 2 business days"
              tone="positive"
              transition={TOAST_VARIANTS[preset]}
              onDismiss={() => setShown(false)}
              className="w-full"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Click a position to replay its enter; × plays the mirrored exit via AnimatePresence. */
export const AllNinePositions: Story = {
  args: { title: '' },
  render: () => <AnimatedDemo />,
};
