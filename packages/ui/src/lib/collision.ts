import type { RefObject } from 'react';

/**
 * Collision-aware reframing math shared by the floating panels (Menu's list,
 * Popover's click card). Both keep a CSS-anchored panel inside a clip box —
 * a `boundary` element's rect or the viewport — by shifting it horizontally
 * and flipping it vertically when the preferred side overflows. The panels
 * differ in how they pick a NATURAL spot (Menu aligns to an anchor edge, the
 * Popover card centers; Menu can prefer `top`, the card an offset) — so those
 * stay at the call sites and only the clamp arithmetic lives here.
 */

/** Breathing room inset from whichever clip box applies (px). */
export const COLLISION_PADDING = 8;

/** The edges a panel must stay within. */
export interface CollisionBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The clip box: the boundary element's rect, else the whole viewport. */
export function collisionBox(boundary: RefObject<HTMLElement | null> | undefined): CollisionBox {
  return (
    boundary?.current?.getBoundingClientRect() ?? {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    }
  );
}

/**
 * Clamp a panel's natural left edge into the box (padding inset) and hand back
 * the delta from the natural spot — the `translateX` correction to apply.
 */
export function clampShiftX(naturalLeft: number, panelWidth: number, box: CollisionBox): number {
  const minLeft = box.left + COLLISION_PADDING;
  const maxLeft = box.right - COLLISION_PADDING - panelWidth;
  const clampedLeft = Math.min(Math.max(naturalLeft, minLeft), Math.max(minLeft, maxLeft));
  return clampedLeft - naturalLeft;
}

/**
 * Would the panel fit on each vertical side of its anchor, inside the box?
 * `offset` is any gap between anchor and panel (Popover's `sideOffset`). The
 * caller owns the flip DECISION (which side it prefers, flip only when the
 * other side actually fits) — this just measures.
 */
export function verticalFits(
  anchorRect: DOMRect,
  panelHeight: number,
  box: CollisionBox,
  offset = 0,
): { fitsBelow: boolean; fitsAbove: boolean } {
  return {
    fitsBelow: anchorRect.bottom + offset + panelHeight <= box.bottom - COLLISION_PADDING,
    fitsAbove: anchorRect.top - offset - panelHeight >= box.top + COLLISION_PADDING,
  };
}

/**
 * Run `compute` now and again on every viewport resize and ancestor scroll
 * (capture, so nested scrollers count) while the panel is open. Returns the
 * cleanup for the effect that called it.
 */
export function reanchorWhileOpen(compute: () => void): () => void {
  compute();
  window.addEventListener('resize', compute);
  window.addEventListener('scroll', compute, true);
  return () => {
    window.removeEventListener('resize', compute);
    window.removeEventListener('scroll', compute, true);
  };
}
