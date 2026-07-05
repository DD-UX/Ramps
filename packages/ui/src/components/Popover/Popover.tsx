'use client';

import { PreviewCard } from '@base-ui-components/react/preview-card';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { useClickAway } from '../../hooks/useClickAway';

/**
 * Popover — the floating detail card behind Bill Pay's **vendor card**
 * (snapshot 7): a white, near-square, softly-shadowed card with the vendor
 * logo + name, a short description, and a footer meta row ("David Wallace &
 * 0 more · Legal & HR").
 *
 * Two trigger modes:
 * - `trigger="click"` (the DEFAULT) — the trigger toggles the card, and it
 *   **stays open until you click away or hit Esc** (the shared `useClickAway`
 *   hook owns that contract). This is how persistent detail cards behave in
 *   the product.
 * - `trigger="hover"` — the frame-7 hovercard: Base UI's headless
 *   `PreviewCard` (hover/focus intent with sensible open/close delays,
 *   portalling, positioning). We own only the skin either way.
 *
 * Both modes are BOUNDARY-AWARE (Popper-style): hover mode inherits flip/shift
 * from Base UI's Positioner; click mode hand-rolls the same two moves in
 * PopoverContent — shift along x to stay inside the viewport (8px padding),
 * flip above the trigger when the bottom would clip and the top fits.
 *
 * Compound so callers assemble their own trigger + content.
 * `"use client"` — it holds open state.
 */
export type PopoverTriggerMode = 'click' | 'hover';

type PopoverContextValue = {
  mode: PopoverTriggerMode;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(part: string): PopoverContextValue {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error(`Popover.${part} must be used inside <Popover>`);
  return ctx;
}

export type PopoverProps = PropsWithChildren<{
  /** How the card opens. Click (default) stays open until click-away/Esc. */
  trigger?: PopoverTriggerMode;
  /** Controlled open state (optional in either mode). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}>;

export function Popover({
  trigger = 'click',
  open: controlledOpen,
  onOpenChange,
  className,
  children,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  const rootRef = useRef<HTMLDivElement>(null);
  // Click mode's dismissal contract: any pointerdown outside the trigger+card,
  // or Esc, closes it. Listeners only exist while open.
  useClickAway(rootRef, () => setOpen(false), { enabled: trigger === 'click' && open });

  if (trigger === 'hover') {
    return (
      <PopoverContext.Provider value={{ mode: 'hover', open, setOpen }}>
        <PreviewCard.Root open={controlledOpen} onOpenChange={onOpenChange}>
          {children}
        </PreviewCard.Root>
      </PopoverContext.Provider>
    );
  }

  return (
    <PopoverContext.Provider value={{ mode: 'click', open, setOpen }}>
      {/* The relative root anchors the click-mode card AND is the click-away
          boundary — clicks on the trigger or inside the card never dismiss. */}
      <div ref={rootRef} className={clsx('relative inline-block', className)}>
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

export type PopoverTriggerProps = PropsWithChildren<{
  /**
   * Hover mode only — open delay in ms. Defaults to 100: Base UI's stock
   * 600ms reads as pure lag on the vendor card, not hover intent.
   */
  delay?: number;
  /** Hover mode only — close delay in ms (default 150, enough to reach the card). */
  closeDelay?: number;
  className?: string;
}>;

/**
 * The trigger. In click mode it's a real `<button>` (toggle, `aria-expanded`);
 * in hover mode it's Base UI's hover/focus target. Wrap the vendor name/logo.
 */
function PopoverTrigger({
  children,
  delay = 100,
  closeDelay = 150,
  className,
}: PopoverTriggerProps) {
  const { mode, open, setOpen } = usePopoverContext('Trigger');

  if (mode === 'hover') {
    return (
      <PreviewCard.Trigger
        delay={delay}
        closeDelay={closeDelay}
        className={clsx(
          'rounded-square cursor-default underline-offset-2 outline-none',
          'focus-visible:ring-control-ring focus-visible:ring-2',
          className,
        )}
      >
        {children}
      </PreviewCard.Trigger>
    );
  }

  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={clsx(
        'rounded-square cursor-pointer underline-offset-2 outline-none',
        'focus-visible:ring-control-ring focus-visible:ring-2',
        className,
      )}
    >
      {children}
    </button>
  );
}

export type PopoverContentProps = PropsWithChildren<{
  /** Distance from the trigger in px. */
  sideOffset?: number;
  className?: string;
}>;

/** Viewport padding the card never crosses (Popper's `padding` default). */
const COLLISION_PADDING = 8;

/** The floating card surface — white, near-square, soft popover shadow. */
function PopoverContent({ children, sideOffset = 8, className }: PopoverContentProps) {
  const { mode, open } = usePopoverContext('Content');

  // Click-mode collision handling (Popper-style, hand-rolled): the card is
  // CSS-anchored centered under the trigger, then nudged to stay inside the
  // viewport — `shiftX` slides it along the x-axis (Popper's "shift"),
  // `flipped` moves it above the trigger when it would fall off the bottom
  // and there IS room on top (Popper's "flip"). Hover mode needs none of
  // this: Base UI's Positioner already flips/shifts on its own.
  const cardRef = useRef<HTMLDivElement>(null);
  const [shiftX, setShiftX] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useLayoutEffect(() => {
    if (mode !== 'click' || !open) return;

    const compute = () => {
      const card = cardRef.current;
      const anchor = card?.parentElement; // the Popover root (relative)
      if (!card || !anchor) return;

      const anchorRect = anchor.getBoundingClientRect();
      // offsetWidth/Height: layout size, immune to the enter animation's
      // scale transform (a getBoundingClientRect mid-fade under-measures).
      const cardW = card.offsetWidth;
      const cardH = card.offsetHeight;

      // Shift: clamp the centered card into the horizontal viewport range.
      const naturalLeft = anchorRect.left + anchorRect.width / 2 - cardW / 2;
      const minLeft = COLLISION_PADDING;
      const maxLeft = window.innerWidth - COLLISION_PADDING - cardW;
      const clampedLeft = Math.min(Math.max(naturalLeft, minLeft), Math.max(minLeft, maxLeft));
      setShiftX(clampedLeft - naturalLeft);

      // Flip: only when below overflows AND above actually fits — otherwise
      // stay below (matching Popper's fallback behavior).
      const fitsBelow =
        anchorRect.bottom + sideOffset + cardH <= window.innerHeight - COLLISION_PADDING;
      const fitsAbove = anchorRect.top - sideOffset - cardH >= COLLISION_PADDING;
      setFlipped(!fitsBelow && fitsAbove);
    };

    compute();
    // Re-anchor while open: viewport resizes and any ancestor scroll.
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [mode, open, sideOffset]);

  // The one skin, shared by both modes.
  const surface = clsx(
    'w-72 max-w-[calc(100vw-2rem)] rounded-square border border-bone bg-white p-rui-4',
    'shadow-popover',
    className,
  );

  if (mode === 'hover') {
    return (
      <PreviewCard.Portal>
        <PreviewCard.Positioner sideOffset={sideOffset} className="z-50 outline-none">
          <PreviewCard.Popup
            data-testid="popover"
            className={clsx(
              surface,
              // Base UI enter/exit state hooks — a quick, GPU-friendly fade+lift.
              'origin-top transition-[opacity,transform] duration-150',
              'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
              'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            )}
          >
            {children}
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    );
  }

  // Click mode mounts/unmounts the card itself, so it animates with motion —
  // the SAME fade+lift the hover mode gets from Base UI's style hooks
  // (opacity+scale, 150ms) — instead of abruptly appearing. It also lands in
  // the SAME spot: centered under the trigger, matching the hover Positioner's
  // default `align="center"` — then the useLayoutEffect above shifts/flips it
  // only when the viewport would clip it (the effect runs pre-paint, so a
  // constrained card never flashes in the wrong place).
  // The -50% centering rides in the motion values because motion owns
  // `transform` — a Tailwind -translate-x-1/2 would be overwritten. The
  // collision shift rides in `left` instead, which motion doesn't touch.
  // mode="wait" is the kit's house rule: a rapid close→reopen queues the
  // re-enter behind the exit instead of overlapping the two cards.
  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          ref={cardRef}
          data-testid="popover"
          role="dialog"
          className={clsx(
            'absolute z-50',
            flipped ? 'bottom-full origin-bottom' : 'top-full origin-top',
            surface,
          )}
          style={{
            left: `calc(50% + ${shiftX}px)`,
            marginTop: flipped ? undefined : sideOffset,
            marginBottom: flipped ? sideOffset : undefined,
          }}
          initial={{ opacity: 0, scale: 0.95, x: '-50%' }}
          animate={{ opacity: 1, scale: 1, x: '-50%' }}
          exit={{
            opacity: 0,
            scale: 0.95,
            x: '-50%',
            transition: { duration: 0.1, ease: 'easeIn' },
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

Popover.Trigger = PopoverTrigger;
Popover.Content = PopoverContent;
