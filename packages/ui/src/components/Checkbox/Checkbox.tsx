'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  type ChangeEvent,
  type InputHTMLAttributes,
  type Ref,
  useCallback,
  useState,
} from 'react';

import { cn } from '../../lib/cn';
import type { MotionClashingHandlers } from '../motion/pressVariants';

/**
 * Checkbox — the multi-select primitive: bulk row-select in the AP table,
 * "Save as default coding for future bills", the vendor request-info modal's
 * checkbox list (docs/watch-youtube/README.md §5–7). Native input for
 * accessibility. Vetted against does-ramp-live-up §15 at 8x zoom: at rest a
 * sharp white square with a thin bone border; checked, a solid success-green
 * fill with a white tick (no border, no rounding).
 *
 * Motion: the tick doesn't blink on — it DRAWS in. The real `<input>` stays the
 * source of truth for events + a11y; we mirror its checked state into React so
 * the tick's `pathLength` can animate (0 → 1) on, fade out off, and the box
 * gives a small spring pop the instant it's checked.
 *
 * Crucially the mirror tracks the **live DOM** `.checked`, not just props: this
 * box is used controlled (`checked`, the Table's select-all), uncontrolled
 * (`defaultChecked`), AND ref-driven — react-hook-form registers it with
 * `{...register(name)}`, which sets `.checked` imperatively through the ref with
 * NO React `onChange`. A prop-only mirror can't see that programmatic set and
 * would leave a green box with no tick. So we read the node's real `.checked`
 * via a callback ref (which also forwards RHF's ref) and re-read it on every
 * change; the animation follows DOM truth in every mode.
 */
export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | MotionClashingHandlers
> {
  label?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({
  label,
  className,
  id,
  onChange,
  checked,
  ref,
  ...props
}: CheckboxProps) {
  // Mirror of the checked state, for the tick + box-pop animation only. Used
  // ONLY in the uncontrolled / ref-driven modes, where React doesn't own the
  // value — `defaultChecked`, or react-hook-form's imperative `.checked` set
  // through the ref (no React onChange). In CONTROLLED mode we DON'T mirror:
  // the `checked` prop is the single source of truth and drives the tick
  // directly (see displayChecked). Seeded false; the callback ref corrects it
  // from the live DOM on mount, and each user change keeps it in step.
  const [mirrorChecked, setMirrorChecked] = useState(false);
  const isControlled = checked !== undefined;

  // Callback ref: forward whatever ref the caller passed (react-hook-form's
  // register() ref included), AND seed the mirror from the node's real, live
  // `.checked` once it mounts — this is what catches RHF's imperative set and
  // plain `defaultChecked` alike, since both land on the DOM with no onChange.
  const attachRef = useCallback(
    (node: HTMLInputElement | null) => {
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
      if (node) setMirrorChecked(node.checked);
    },
    [ref],
  );

  // The value the tick + pop animation follow. Controlled: read the prop
  // DIRECTLY — no state copy to fall out of sync, so a remote flip (the AP
  // table's select-all / clear-selection, which re-renders every row's box by
  // prop with NO onChange) draws the tick immediately. Uncontrolled/ref-driven:
  // fall back to the DOM-seeded mirror, since React doesn't own the value.
  const displayChecked = isControlled ? checked : mirrorChecked;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Only the uncontrolled mirror needs updating on a user change; controlled
    // mode re-renders from the parent's new `checked` prop.
    if (!isControlled) setMirrorChecked(e.target.checked);
    onChange?.(e);
  };

  const control = (
    <span className="size-4 relative inline-flex shrink-0">
      <motion.input
        ref={attachRef}
        id={id}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        // A small spring pop the moment it's checked (0.9 → 1), so ticking a box
        // feels like a deliberate, physical confirm; the box rests at 1 when off.
        animate={{ scale: displayChecked ? [0.9, 1] : 1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 18 }}
        className={cn(
          'peer size-4 rounded-square border-control-border bg-white cursor-pointer appearance-none border',
          'checked:border-positive checked:bg-positive',
          'focus:border-control-border-focus focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...props}
      />
      {/* Tick — draws IN (pathLength 0 → 1) when checked, fades out when not.
          Absolutely over the input, ignores pointer events. */}
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="inset-0 size-4 text-white pointer-events-none absolute"
      >
        <AnimatePresence initial={false}>
          {displayChecked && (
            <motion.path
              d="M4 8.5 7 11.5 12 5"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </svg>
    </span>
  );

  if (!label) return control;

  return (
    <label
      htmlFor={id}
      // The WHOLE label is the hit area: pointer when enabled, and when the
      // input is disabled the not-allowed cursor covers the label text too —
      // clicking "Tax details (W-9)" must feel as inert as the box itself.
      className="gap-rui-2 text-sm font-body text-ink inline-flex cursor-pointer items-center has-[input:disabled]:cursor-not-allowed"
    >
      {control}
      {label}
    </label>
  );
}
