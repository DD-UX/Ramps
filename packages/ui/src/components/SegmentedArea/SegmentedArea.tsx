'use client';

import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode,useId, useState } from 'react';

import { SegmentedControl } from '../SegmentedControl/SegmentedControl';

/**
 * SegmentedArea — a {@link SegmentedControl} promoted to a tab system: the
 * strip on top, a content area underneath, exactly like the pay-by-card panel
 * (product-overview snapshot 12: `[ New card | Existing card ]` with the
 * three payout option cards living below the selected segment).
 *
 * Vetted from the frame: the area itself is a PLAIN white region — no extra
 * border box under the control (samples right below the strip read the page
 * white, ~#fbfaf6); the content brings its own surfaces (the option cards).
 * So the area here is just a padded region separated by a `pt` gap.
 *
 * Panels swap with a quiet fade via AnimatePresence — `mode="wait"` per the
 * house rule, so the outgoing panel finishes before the next one enters.
 *
 * Works controlled (`value` + `onValueChange`) or uncontrolled
 * (`defaultValue`, else the first tab).
 */
export interface SegmentedAreaTab {
  value: string;
  label: ReactNode;
  content: ReactNode;
}

export interface SegmentedAreaProps {
  tabs: SegmentedAreaTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function SegmentedArea({
  tabs,
  value,
  defaultValue,
  onValueChange,
  className,
}: SegmentedAreaProps) {
  const panelId = useId();
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.value ?? '');
  // Controlled wins when provided; otherwise we own the selection.
  const active = value ?? internal;
  const activeTab = tabs.find((tab) => tab.value === active);

  const select = (next: string) => {
    setInternal(next);
    onValueChange?.(next);
  };

  return (
    <div className={clsx('flex flex-col', className)}>
      <SegmentedControl
        options={tabs.map(({ value: tabValue, label }) => ({ value: tabValue, label }))}
        value={active}
        onValueChange={select}
      />
      <div id={panelId} role="tabpanel" data-testid="segmented-area-panel">
        {/* mode="wait": the leaving panel fades out fully before the next fades in. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="pt-rui-4"
          >
            {activeTab?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
