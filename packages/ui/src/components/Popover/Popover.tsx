'use client';

import { PreviewCard } from '@base-ui-components/react/preview-card';
import { clsx } from 'clsx';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
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
  /** Hover mode only — open delay in ms (Base UI default 600). */
  delay?: number;
  /** Hover mode only — close delay in ms (Base UI default 300). */
  closeDelay?: number;
  className?: string;
}>;

/**
 * The trigger. In click mode it's a real `<button>` (toggle, `aria-expanded`);
 * in hover mode it's Base UI's hover/focus target. Wrap the vendor name/logo.
 */
function PopoverTrigger({ children, delay, closeDelay, className }: PopoverTriggerProps) {
  const { mode, open, setOpen } = usePopoverContext('Trigger');

  if (mode === 'hover') {
    return (
      <PreviewCard.Trigger
        delay={delay}
        closeDelay={closeDelay}
        className={clsx(
          'cursor-default rounded-square underline-offset-2 outline-none',
          'focus-visible:ring-2 focus-visible:ring-control-ring',
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
        'cursor-pointer rounded-square underline-offset-2 outline-none',
        'focus-visible:ring-2 focus-visible:ring-control-ring',
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

/** The floating card surface — white, near-square, soft popover shadow. */
function PopoverContent({ children, sideOffset = 8, className }: PopoverContentProps) {
  const { mode, open } = usePopoverContext('Content');

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

  if (!open) return null;

  return (
    <div
      data-testid="popover"
      role="dialog"
      className={clsx('absolute left-0 top-full z-50', surface)}
      style={{ marginTop: sideOffset }}
    >
      {children}
    </div>
  );
}

Popover.Trigger = PopoverTrigger;
Popover.Content = PopoverContent;
