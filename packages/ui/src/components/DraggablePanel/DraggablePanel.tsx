'use client';

import { GripVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '../../lib/cn';

/**
 * DraggablePanel — the **resizable two-pane split** behind the bill-detail
 * screen (snapshots 7/8/10): the coding/approvals form on the left, the invoice
 * preview on the right, parted by a slim vertical **drag handle** (the ⋮⋮ grip
 * you see mid-frame). Dragging the handle re-apportions the two panes.
 *
 * Pointer-driven and clamped to `min`/`max` percentages; the handle is a
 * focusable button that's keyboard-operable (←/→ nudge, Home/End snap) and
 * announces the current split via its label. `"use client"` — it tracks drag
 * state.
 *
 * **Independent scroll + always-centered grip.** The panel fills the height its
 * parent hands it (`h-full min-h-0`) and each pane is its OWN scroll container
 * (`min-h-0 overflow-y-auto`), so the two sides scroll independently — reading a
 * long invoice on the right never moves the coding form on the left. The grip
 * lives in the full-height handle rail BETWEEN the two scrollers (not inside
 * either one), so it stays pinned to the panel's vertical center and remains
 * visible no matter how far either side is scrolled. The caller MUST bound the
 * panel's height (e.g. a viewport-tall flex parent) for the scroll to engage.
 *
 * Layout only: callers pass whatever content they like into `left`/`right`.
 */
export interface DraggablePanelProps {
  left: ReactNode;
  right: ReactNode;
  /** Initial left-pane width as a percentage (uncontrolled). */
  defaultSplit?: number;
  /** Clamp bounds for the left pane, in percent. */
  min?: number;
  max?: number;
  /**
   * Ref to the LEFT pane's scroll container. Handed out so floating content
   * inside the left pane (e.g. a Popover/Menu) can pass it as a `boundary` and
   * reframe within the pane instead of spilling across the divider into the
   * right pane. Layout is otherwise unchanged whether or not it's supplied.
   */
  leftPaneRef?: RefObject<HTMLDivElement | null>;
  className?: string;
}

export function DraggablePanel({
  left,
  right,
  defaultSplit = 55,
  min = 25,
  max = 75,
  leftPaneRef,
  className,
}: DraggablePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(defaultSplit);
  const [dragging, setDragging] = useState(false);
  // Pad hover, tracked in React (via Framer's onHoverStart/End) rather than CSS
  // `group-hover` — because hovering the pad must recolor a SEPARATE element (the
  // divider line, the pad's parent), which a self-scoped hover can't reach.
  const [hovering, setHovering] = useState(false);

  const clamp = useCallback((pct: number) => Math.min(max, Math.max(min, pct)), [min, max]);

  const setFromClientX = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      setSplit(clamp(((clientX - rect.left) / rect.width) * 100));
    },
    [clamp],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => setFromClientX(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, setFromClientX]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setSplit((s) => clamp(s - 2));
    else if (e.key === 'ArrowRight') setSplit((s) => clamp(s + 2));
    else if (e.key === 'Home') setSplit(min);
    else if (e.key === 'End') setSplit(max);
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'rounded-square border-bone bg-white min-h-0 flex h-full w-full items-stretch overflow-hidden border',
        dragging && 'select-none',
        className,
      )}
    >
      {/* Left pane — its OWN vertical scroll container. min-h-0 lets tall content
          scroll here instead of stretching the panel; overflow-x-auto keeps wide
          content in-pane. Scrolls independently of the right side. */}
      <div
        ref={leftPaneRef}
        className="min-w-0 min-h-0 flex flex-col overflow-x-auto overflow-y-auto"
        style={{ width: `${split}%` }}
      >
        {left}
      </div>

      {/* The drag handle — a slim bone rail carrying the frame-7/8 grip: a
          small **stone-gray circle** with a soft card shadow and the dark ⋮⋮
          dots (one of the few vetted-round elements in the kit). Re-sampled
          frame 7 at 1px: the face is #dcdbd6–#e6e2df — the stone token —
          NOT limestone, which had no contrast against the panes.
          A native <button> carries the separator semantics so it's focusable
          and keyboard-operable without fighting the a11y linter.
          The rail is a full-height sibling BETWEEN the two scroll containers, so
          the absolute-centered grip stays pinned to the panel's vertical center
          and never scrolls out of view with either pane.
          Interaction: on HOVER the line darkens (bone → hushed), the pad grows
          and its ring darkens to ink; while DRAGGING the line goes electric blue
          and the pad presses in (shrinks) and goes electric to match — so
          grabbing the divider reads as a live, physical control. */}
      <button
        type="button"
        data-testid="drag-handle"
        aria-label={`Resize panels (left pane ${Math.round(split)}%)`}
        onPointerDown={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onKeyDown={onKeyDown}
        className={cn(
          'group p-0 relative flex w-px shrink-0 cursor-col-resize items-center justify-center',
          'transition-colors outline-none',
          // The divider LINE: bone at rest, darkens to INK while the pad is
          // hovered, and turns electric blue the whole time you're dragging it —
          // the live "you're manipulating this" cue. Hover comes from React
          // state (below), not group-hover, so it reliably reaches this element.
          dragging ? 'bg-electric' : hovering ? 'bg-ink' : 'bg-bone',
        )}
      >
        <motion.span
          data-testid="drag-grip"
          // Hover GROWS the pad; dragging PRESSES it (shrinks past rest) so it
          // feels pushed in. Snappy spring settle, no wobble. Framer owns the
          // hover here (onHoverStart/End) and reports it up to React state, so
          // ONE source of truth drives both the pad AND the divider line — no
          // CSS group-hover racing the scale animation.
          animate={{ scale: dragging ? 0.9 : hovering ? 1.15 : 1 }}
          onHoverStart={() => setHovering(true)}
          onHoverEnd={() => setHovering(false)}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            // Frame 7 at 10x + 1px sampling: a circular STONE chip, soft
            // shadow, ink dots — a full step darker than the panes so it keeps
            // contrast on the limestone canvas too. NO border at rest (the
            // shadow does the lifting — the vetted contract).
            'size-7 rounded-pill bg-stone text-ink absolute flex items-center justify-center',
            // The hover outline is an OUTLINE (its own CSS property), not a
            // border, so it darkens the pad's edge WITHOUT adding layout width —
            // no size jump, and the resting chip stays border-free.
            'outline outline-1 -outline-offset-1 outline-transparent',
            'shadow-card group-focus-visible:shadow-popover transition-[box-shadow,background-color,color,outline-color]',
            // While dragging the pad reads as the active control: electric fill +
            // outline, dots flip white. On HOVER the outline darkens to INK, the
            // fill warms to bone, and the shadow lifts — all off the same state.
            dragging
              ? 'bg-electric outline-electric text-white shadow-popover'
              : hovering
                ? 'bg-bone outline-ink shadow-popover'
                : '',
          )}
        >
          <GripVertical size={14} />
        </motion.span>
      </button>

      {/* Right pane = the preview CANVAS. Frames 7/8/10 sample #f6f5f1–#fbfaf6
          out there — the warm limestone wash the white invoice sheet floats
          on — never the same white as the form pane. */}
      <div className="min-w-0 min-h-0 bg-limestone flex flex-1 flex-col overflow-x-auto overflow-y-auto">
        {right}
      </div>
    </div>
  );
}
