'use client';

import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createContext, type PropsWithChildren, useContext, useEffect, useId, useRef } from 'react';

import { useClickAway } from '../../hooks/useClickAway';
import { cn } from '../../lib/cn';
import { IconButton } from '../IconButton/IconButton';

/**
 * Modal — the centred confirmation dialog from the **"When do you want to pay
 * this bill?"** step (…/does-ramp-live-up-to-the-hype…/snapshots/
 * 13-when-to-pay-modal.jpeg).
 *
 * Vetted against frame 13:
 * - the scrim is **light**, not dark — the page washes out under a whitish
 *   veil (sampled ~#f8f4f5 over both the sidebar and the table);
 * - the panel is ONE white padded surface: sharp near-square corner, faint
 *   bone edge, soft popover shadow, and **no divider rows** — title + ✕,
 *   body copy, then the footer with "Cancel" (underline link) left and the
 *   lime primary right;
 * - dismissal: the ✕, Esc, or a click on the scrim (`useClickAway` owns the
 *   click-away + Esc contract, same as click-mode Popover).
 *
 * Compound (`Modal.Header` / `Modal.Body` / `Modal.Footer`) so callers own
 * the content; the panel is labelled by the Header title for a11y.
 * `"use client"` — it locks body scroll and listens for dismissal.
 *
 * Animated: the scrim fades while the panel pops (scale 0.96 + 8px rise —
 * the popCenter recipe; a centred surface has no edge to slide from), and
 * `AnimatePresence` plays the mirrored exit when `open` flips false.
 */
type ModalContextValue = { onClose: () => void; titleId: string };

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext(part: string): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error(`Modal.${part} must be used inside <Modal>`);
  return ctx;
}

export type ModalProps = PropsWithChildren<{
  open: boolean;
  /** Called on ✕, Esc, or a click on the scrim. */
  onClose: () => void;
  className?: string;
}>;

export function Modal({ open, onClose, className, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Clicking the scrim (anything outside the panel) or hitting Esc dismisses.
  useClickAway(panelRef, onClose, { enabled: open });

  // Lock body scroll while open — the frame's page sits frozen under the veil.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <ModalContext.Provider value={{ onClose, titleId }}>
      {/* AnimatePresence lets the exit phase play while `open` flips false.
          mode="wait" is the kit's house rule: if `open` flips back on
          mid-exit, the re-enter waits for the exit to finish instead of both
          playing on top of each other. The scrim below is frame 13's LIGHT
          whitish wash (~#f8f4f5 sampled over the page), never a dark dim —
          and it fades… */}
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            data-testid="modal-overlay"
            className="inset-0 bg-white/75 p-rui-4 fixed z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {/* …while the panel pops: the same quiet scale+fade as the
                popCenter toast preset (a centred surface has no edge to
                slide from). */}
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-testid="modal"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 8,
                transition: { duration: 0.15, ease: 'easeIn' },
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                // One padded surface — no divider rows; the gap carries the rhythm.
                'max-w-md gap-rui-4 rounded-square border-bone bg-white p-rui-6 flex w-full flex-col border',
                'shadow-popover',
                className,
              )}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

export type ModalHeaderProps = PropsWithChildren<{ className?: string }>;

/** Title row — ink heading left, hushed ✕ top-right (frame 13). */
function ModalHeader({ children, className }: ModalHeaderProps) {
  const { onClose, titleId } = useModalContext('Header');
  return (
    <div className={cn('gap-rui-3 flex items-start justify-between', className)}>
      <h2 id={titleId} className="text-lg font-heading text-ink">
        {children}
      </h2>
      <IconButton label="Close" icon={<X size={16} />} size="sm" onClick={onClose} />
    </div>
  );
}

export type ModalBodyProps = PropsWithChildren<{ className?: string }>;

/** Body slot — callers own the copy/fields; hushed sm reads as the default. */
function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('gap-rui-4 text-sm text-ink flex flex-col', className)}>{children}</div>
  );
}

export type ModalFooterProps = PropsWithChildren<{ className?: string }>;

/** Footer — "Cancel" hugs the left, the primary CTA the right (frame 13). */
function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('mt-rui-2 gap-rui-3 flex items-center justify-between', className)}>
      {children}
    </div>
  );
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
