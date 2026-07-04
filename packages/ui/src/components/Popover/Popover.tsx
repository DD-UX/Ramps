'use client';

import { PreviewCard } from '@base-ui-components/react/preview-card';
import { clsx } from 'clsx';
import type { PropsWithChildren } from 'react';

/**
 * Popover — the hover-triggered preview card behind Bill Pay's **vendor
 * hovercard** (snapshot 7): hovering the vendor name/logo floats a white,
 * near-square, softly-shadowed card with the vendor logo + name, a short
 * description, and a footer meta row ("David Wallace & 0 more · Legal & HR").
 *
 * Built on Base UI's headless `PreviewCard` (hover/focus intent with sensible
 * open/close delays, portalling, positioning, dismiss) — we own only the skin:
 * tokens, near-square corners, soft popover shadow, quick fade+lift on
 * enter/exit. Compound so callers assemble their own trigger + content.
 *
 * `"use client"` — it holds open state and portals.
 */
export type PopoverProps = PropsWithChildren<{
  /** Controlled open state (optional; hover intent drives it otherwise). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>;

export function Popover({ children, open, onOpenChange }: PopoverProps) {
  return (
    <PreviewCard.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </PreviewCard.Root>
  );
}

export type PopoverTriggerProps = PropsWithChildren<{
  /** Open delay in ms (Base UI default 600). */
  delay?: number;
  /** Close delay in ms (Base UI default 300). */
  closeDelay?: number;
  className?: string;
}>;

/**
 * The hover target. Renders an anchor-like inline trigger; wrap the vendor name
 * or logo. Uses `render` so the caller's element becomes the trigger.
 */
function PopoverTrigger({ children, delay, closeDelay, className }: PopoverTriggerProps) {
  return (
    <PreviewCard.Trigger
      delay={delay}
      closeDelay={closeDelay}
      className={clsx(
        'cursor-default rounded-control underline-offset-2 outline-none',
        'focus-visible:ring-2 focus-visible:ring-control-ring',
        className,
      )}
    >
      {children}
    </PreviewCard.Trigger>
  );
}

export type PopoverContentProps = PropsWithChildren<{
  /** Distance from the trigger in px. */
  sideOffset?: number;
  className?: string;
}>;

/** The floating card surface — white, near-square, soft popover shadow. */
function PopoverContent({ children, sideOffset = 8, className }: PopoverContentProps) {
  return (
    <PreviewCard.Portal>
      <PreviewCard.Positioner sideOffset={sideOffset} className="z-50 outline-none">
        <PreviewCard.Popup
          data-testid="popover"
          className={clsx(
            'w-72 max-w-[calc(100vw-2rem)] rounded-square border border-bone bg-white p-rui-4',
            'shadow-popover',
            // Base UI enter/exit state hooks — a quick, GPU-friendly fade+lift.
            'origin-top transition-[opacity,transform] duration-150',
            'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            className,
          )}
        >
          {children}
        </PreviewCard.Popup>
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  );
}

Popover.Trigger = PopoverTrigger;
Popover.Content = PopoverContent;
