import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { clsx } from 'clsx';
import { AnimatePresence } from 'motion/react';
import { useState } from 'react';

import { Button } from '../Button/Button';
import { Toast, TOAST_VARIANTS, type ToastVariantName } from './Toast';

const meta = {
  title: 'Primitives/Toast',
  component: Toast,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Card-width wrapper for the single-toast stories. Applied per-story (not on
 * meta) so the AllNinePositions stage can take the room it needs.
 */
const inCard: Decorator = (Story) => (
  <div style={{ width: 340 }}>
    <Story />
  </div>
);

/** The signature upload toast (snapshot 3): white card, spinner + title, × dismiss. */
export const Uploading: Story = {
  decorators: [inCard],
  args: { title: 'Uploading 3 invoices', loading: true, onDismiss: () => {} },
};

/** Success — positive check icon, arrival copy. */
export const PaymentScheduled: Story = {
  decorators: [inCard],
  args: {
    title: 'Payment scheduled',
    description: 'Arrives in 2 business days',
    tone: 'positive',
    onDismiss: () => {},
  },
};

/** Failure — critical (orange, never red), retry hint. */
export const PaymentFailed: Story = {
  decorators: [inCard],
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
  decorators: [inCard],
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
 * Where each preset's toast LIVES on screen — the flex alignment of a
 * stage-filling layer. Placement comes from this wrapper (not the toast)
 * because motion owns the toast's `transform` for the slide itself.
 */
const PLACEMENT: Record<ToastVariantName, string> = {
  slideTopLeft: 'items-start justify-start',
  slideTop: 'items-start justify-center',
  slideTopRight: 'items-start justify-end',
  slideLeft: 'items-center justify-start',
  popCenter: 'items-center justify-center',
  slideRight: 'items-center justify-end',
  slideBottomLeft: 'items-end justify-start',
  slideBottom: 'items-end justify-center',
  slideBottomRight: 'items-end justify-end',
};

/**
 * Stateful demo extracted as a component (lint: no hooks in render functions).
 * The toast plays on an app-sized limestone STAGE and mounts in the preset's
 * home corner/edge — a bottom-right slide actually enters at the bottom right,
 * instead of replaying every preset in a toast-sized box. `key={preset + seq}`
 * remounts so the enter phase replays; `AnimatePresence` plays the exit.
 */
function AnimatedDemo() {
  const [preset, setPreset] = useState<ToastVariantName>('slideBottomRight');
  const [seq, setSeq] = useState(0);
  const [shown, setShown] = useState(true);

  return (
    <div className="flex flex-col items-center gap-rui-4">
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
      {/* The stage — a stand-in app viewport. overflow-hidden clips the
          off-stage start of each slide so entries read as arrivals. */}
      <div className="relative h-96 w-[720px] overflow-hidden border border-bone bg-limestone">
        <div
          className={clsx('pointer-events-none absolute inset-0 flex p-rui-4', PLACEMENT[preset])}
        >
          <AnimatePresence>
            {shown && (
              <Toast
                key={`${preset}-${seq}`}
                title="Payment scheduled"
                description="Arrives in 2 business days"
                tone="positive"
                transition={TOAST_VARIANTS[preset]}
                onDismiss={() => setShown(false)}
                className="pointer-events-auto w-80"
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/** Click a position to replay its enter; × plays the mirrored exit via AnimatePresence. */
export const AllNinePositions: Story = {
  args: { title: '' },
  render: () => <AnimatedDemo />,
};
