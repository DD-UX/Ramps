'use client';

import { Toast, TOAST_VARIANTS } from '@ramps/ui/Toast';
import { AnimatePresence } from 'motion/react';
import { useEffect } from 'react';

/**
 * The Save-draft feedback toast (snapshot 3's top-right white card): a
 * spinner-led "Saving draft…" while the PUT is in flight, swapped for a
 * positive "Draft saved" once it lands. The phase is OWNED by the save
 * trigger (the footer) — this leaf renders it, auto-dismisses the success
 * card after a beat, and plays the DS's top-right slide through
 * `AnimatePresence mode="wait"` (house rule: the replacement enters only
 * after the old card has fully left). Failures render nothing here — the
 * footer's inline `FieldError` already carries the error where the action is.
 */
export type SaveToastPhase = 'saving' | 'saved';

/** How long the success card lingers before dismissing itself. */
const SAVED_TOAST_MS = 3500;

export interface BillDetailsSaveToastProps {
  /** The current phase, or null when no toast should show. */
  phase: SaveToastPhase | null;
  /** Clear the phase — the × button and the success auto-dismiss both land here. */
  onDismiss: () => void;
  /**
   * What the toast says was saved — 'draft' for the pre-submit "Save draft"
   * flow, 'bill' for the read-only screen's Edit bill → Save bill round trip.
   */
  noun?: 'draft' | 'bill';
}

export function BillDetailsSaveToast({ phase, onDismiss, noun = 'draft' }: BillDetailsSaveToastProps) {
  // The success card excuses itself; the saving card stays until resolution.
  useEffect(() => {
    if (phase !== 'saved') return;
    const timer = setTimeout(onDismiss, SAVED_TOAST_MS);
    return () => clearTimeout(timer);
  }, [phase, onDismiss]);

  return (
    <AnimatePresence mode="wait">
      {phase && (
        <Toast
          // Keyed by phase so saving → saved plays exit-then-enter, reading
          // as two moments of one flow rather than a mutating card.
          key={phase}
          transition={TOAST_VARIANTS.slideTopRight}
          loading={phase === 'saving'}
          tone={phase === 'saved' ? 'positive' : 'neutral'}
          title={
            phase === 'saving'
              ? `Saving ${noun}…`
              : noun === 'bill'
                ? 'Bill saved'
                : 'Draft saved'
          }
          description={phase === 'saved' ? 'Your changes were saved correctly.' : undefined}
          onDismiss={onDismiss}
          // rui-6 (24px) off the corner so the card floats clear of the
          // viewport edge; the ink-tinted border replaces the DS's bone
          // hairline, which washes out against the limestone document pane.
          className="top-rui-6 right-rui-6 border-ink/15 w-80 fixed z-50"
        />
      )}
    </AnimatePresence>
  );
}
