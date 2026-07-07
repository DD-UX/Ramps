import type { ReactNode, RefObject } from 'react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '../../lib/cn';
import { DISABLED_CONTROL } from '../../lib/disabled';
import { IconButton } from '../IconButton/IconButton';

/**
 * Menu — the overflow / action menu that hangs off the three-dot IconButton in
 * every Bill Pay table row and card header (Edit · Duplicate · Delete, "Pay now",
 * "Mark as paid", "Remove") — see the row overflow in
 * …/snapshots/18-overview-grouped-by-status.jpeg.
 *
 * Kept self-contained and dependency-free: a controlled/uncontrolled popover that
 * closes on outside-click and Escape, renders a list of MenuItems, and routes
 * `tone="destructive"` items to the destructive token (Delete/Remove in red).
 * Tokens only.
 *
 * BOUNDARY-AWARE (Popper-style), the same rule the Popover follows: `align`/`side`
 * are the PREFERRED placement, then the open panel REFRAMES to stay on screen —
 * it shifts along x so it never crosses an 8px viewport padding, and flips to the
 * opposite side when the preferred side would clip and the other side fits. So a
 * row-end ⋮ near the right edge (or a trigger low in the viewport) no longer
 * pushes its panel off-screen. The measure runs in a layout effect (pre-paint, so
 * a constrained panel never flashes in the wrong spot) and re-runs on resize and
 * ancestor scroll while open.
 */
const DotsIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <circle cx="8" cy="3" r="1.4" />
    <circle cx="8" cy="8" r="1.4" />
    <circle cx="8" cy="13" r="1.4" />
  </svg>
);

export type MenuItemTone = 'default' | 'destructive';
export type MenuAlign = 'start' | 'end';
export type MenuSide = 'top' | 'bottom';

export interface MenuItem {
  label: ReactNode;
  onSelect?: () => void;
  tone?: MenuItemTone;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface MenuProps {
  items: MenuItem[];
  /** Accessible name for the default overflow trigger. */
  label?: string;
  /** Override the trigger entirely (still gets the click handler wired). */
  trigger?: ReactNode;
  /**
   * Pill-shaped default trigger — forwarded to the built-in overflow
   * IconButton (same contract as Button/IconButton `rounded`). Ignored when a
   * custom `trigger` is supplied; shape that trigger yourself.
   */
  rounded?: boolean;
  align?: MenuAlign;
  /**
   * Which side of the trigger the panel opens on. `bottom` (default) hangs the
   * panel below; `top` raises it above — used by the Table's pagination footer,
   * whose triggers live in a sticky BOTTOM band where a downward panel would be
   * clipped by the scroll container.
   */
  side?: MenuSide;
  /**
   * The box the panel must stay inside when it reframes. Pass a ref to a
   * scroll/clip container — e.g. the DraggablePanel's LEFT PANE — and the menu
   * shifts/flips within THAT element's rect instead of the whole viewport, so a
   * menu in the coding form never spills across the split into the invoice
   * preview. Defaults to the viewport when omitted (or the ref is unset). The
   * 8px padding is always inset from whichever boundary applies.
   */
  boundary?: RefObject<HTMLElement | null>;
  className?: string;
}

const ITEM_TONE: Record<MenuItemTone, string> = {
  default: 'text-ink hover:bg-limestone',
  destructive: 'text-destructive hover:bg-tone-critical-surface',
};

/** Viewport padding the panel never crosses when reframing (matches Popover). */
const COLLISION_PADDING = 8;

export function Menu({
  items,
  label = 'More actions',
  trigger,
  rounded = false,
  align = 'end',
  side = 'bottom',
  boundary,
  className,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Reframe state (Popper-style): `shiftX` slides the panel along x to stay
  // inside the viewport; `flipped` moves it to the side opposite the preferred
  // one when the preferred side would clip. Both start neutral so the first
  // paint uses the caller's `align`/`side` untouched.
  const [shiftX, setShiftX] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Reframe the open panel into its boundary. The panel is CSS-anchored to the
  // trigger by `align`/`side` (its natural rect); from there we measure and:
  //   • shift-x — nudge it back inside the [left+PADDING, right−PADDING] band,
  //     applied as a transform on top of the natural anchoring;
  //   • flip-y  — swap to the opposite side only when the preferred side clips
  //     AND the opposite side fits (Popper's fallback; otherwise stay put).
  // The boundary is the `boundary` element's rect, or the viewport when unset —
  // so a menu can be kept inside, say, the DraggablePanel's left pane instead of
  // spilling across the split. useLayoutEffect so the correction lands before
  // paint (a clipped panel never flashes in the wrong place) and re-runs on
  // resize/ancestor scroll while open.
  useLayoutEffect(() => {
    if (!open) return;

    const compute = () => {
      const panel = menuRef.current;
      const anchor = rootRef.current;
      if (!panel || !anchor) return;

      const anchorRect = anchor.getBoundingClientRect();
      // The clip box: the boundary element's rect, else the whole viewport.
      const box = boundary?.current?.getBoundingClientRect() ?? {
        left: 0,
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
      };
      // offsetWidth/Height: layout size, independent of any transform.
      const panelW = panel.offsetWidth;
      const panelH = panel.offsetHeight;

      // Natural left edge from the preferred horizontal alignment: `end` right-
      // aligns the panel to the anchor, `start` left-aligns it. Shift clamps that
      // edge into the boundary, then we hand back the delta from the natural spot.
      const naturalLeft = align === 'end' ? anchorRect.right - panelW : anchorRect.left;
      const minLeft = box.left + COLLISION_PADDING;
      const maxLeft = box.right - COLLISION_PADDING - panelW;
      const clampedLeft = Math.min(Math.max(naturalLeft, minLeft), Math.max(minLeft, maxLeft));
      setShiftX(clampedLeft - naturalLeft);

      // Flip only when the preferred vertical side overflows the boundary AND the
      // other side fits within it.
      const fitsBelow = anchorRect.bottom + panelH <= box.bottom - COLLISION_PADDING;
      const fitsAbove = anchorRect.top - panelH >= box.top + COLLISION_PADDING;
      const preferTop = side === 'top';
      setFlipped(preferTop ? !fitsAbove && fitsBelow : !fitsBelow && fitsAbove);
    };

    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [open, align, side, boundary]);

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      {trigger ? (
        <span
          role="button"
          tabIndex={0}
          className="cursor-pointer"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen((v) => !v);
            }
          }}
        >
          {trigger}
        </span>
      ) : (
        <IconButton
          label={label}
          icon={DotsIcon}
          rounded={rounded}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((v) => !v)}
        />
      )}

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          className={cn(
            'min-w-44 rounded-square border-bone bg-white py-rui-1 shadow-lg absolute z-20 overflow-hidden border',
            // `flipped` swaps the preferred vertical side; align stays the natural
            // CSS anchor and the shift rides in a transform so it doesn't fight it.
            flipped
              ? side === 'bottom'
                ? 'mb-rui-1 bottom-full'
                : 'mt-rui-1 top-full'
              : side === 'bottom'
                ? 'mt-rui-1 top-full'
                : 'mb-rui-1 bottom-full',
            align === 'end' ? 'right-0' : 'left-0',
          )}
          // Shift rides in a transform (not `left`) so it layers on top of the
          // right-0/left-0 anchor without overriding it.
          style={shiftX ? { transform: `translateX(${shiftX}px)` } : undefined}
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                setOpen(false);
                item.onSelect?.();
              }}
              className={cn(
                'gap-rui-2 px-rui-3 py-rui-2 text-sm font-body flex w-full cursor-pointer items-center text-left transition-colors',
                'focus:bg-limestone focus:outline-none',
                ITEM_TONE[item.tone ?? 'default'],
                // Consistent inert gray when disabled (after the tone so it
                // wins the fill/hover conflict). The item is natively disabled
                // and the onSelect is guarded, so no pointer-events hack needed.
                DISABLED_CONTROL,
              )}
            >
              {item.icon && <span aria-hidden>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
