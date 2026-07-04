'use client';

import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

import { IconButton } from '../IconButton/IconButton';
import { Spinner } from '../Spinner/Spinner';
import type { ToastMotionPreset } from './toastVariants';

export { TOAST_VARIANTS, type ToastMotionPreset, type ToastVariantName } from './toastVariants';

/**
 * Toast — the transient feedback surface for async actions: "Uploading 3
 * invoices", "Payment scheduled", "Bill approved" (docs/watch-youtube/README.md
 * §2).
 *
 * Reworked against snapshot 3 (03-uploading-3-invoices-toast): Ramp's toast is a
 * **white card, thin bone border, near-square corners, soft popover shadow**,
 * top-right — not the dark-ink slab the seed used. A quiet leading indicator
 * carries the status (a Spinner while working, or a tone icon once settled) and
 * an "×" dismiss sits on the right. Tone borrows the StatusPill families so
 * success reads positive and failures read critical (orange, never red).
 *
 * Presentational + controlled — the app owns show/dismiss and stacking; this
 * renders one toast.
 */
export type ToastTone = 'neutral' | 'positive' | 'critical' | 'info';

/** Tone → the leading status icon shown when not `loading`. */
const TONE_ICON: Record<ToastTone, ReactNode> = {
  neutral: <Info size={16} className="text-hushed" />,
  positive: <CheckCircle2 size={16} className="text-tone-positive-on" />,
  critical: <AlertTriangle size={16} className="text-destructive" />,
  info: <Info size={16} className="text-tone-info-on" />,
};

export interface ToastProps {
  title: string;
  description?: ReactNode;
  tone?: ToastTone;
  /** Show a Spinner instead of the tone icon (e.g. the "Uploading…" state). */
  loading?: boolean;
  onDismiss?: () => void;
  /**
   * Enter/exit motion — spread one of the `TOAST_VARIANTS` presets
   * (`slideBottomRight`, `slideTop`, `popCenter`, … all 9 positions):
   *
   * ```tsx
   * <Toast transition={TOAST_VARIANTS.slideBottomRight} title="…" />
   * ```
   *
   * Omit it for a static toast. Wrap in `<AnimatePresence>` if you want the
   * exit phase to play on unmount.
   */
  transition?: ToastMotionPreset;
  className?: string;
}

export function Toast({
  title,
  description,
  tone = 'neutral',
  loading,
  onDismiss,
  transition,
  className,
}: ToastProps) {
  return (
    <motion.div
      role="status"
      data-testid="toast"
      {...transition}
      className={clsx(
        // White, near-square card on a thin border with a soft popover shadow —
        // the snapshot-3 surface.
        'flex items-start gap-rui-3 rounded-square border border-bone bg-white px-rui-4 py-rui-3 shadow-popover',
        className,
      )}
    >
      {/* The icon box matches the title's 20px line so a single-line toast
          reads centred; with a description it stays pinned to the first line. */}
      <span className="flex h-5 shrink-0 items-center" aria-hidden>
        {loading ? <Spinner size="sm" className="text-hushed" /> : TONE_ICON[tone]}
      </span>

      {/* gap, not margins: the column owns the rhythm whether the toast is one
          line (title only) or two (title + description). */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-heading text-ink">{title}</p>
        {description && <p className="text-xs font-body text-hushed">{description}</p>}
      </div>

      {onDismiss && (
        <IconButton
          label="Dismiss"
          size="sm"
          icon={<X size={16} />}
          onClick={onDismiss}
          // -my-1 recentres the 28px button on the 20px first line without
          // inflating the toast's height.
          className="-my-1 -mr-rui-1 shrink-0"
        />
      )}
    </motion.div>
  );
}
