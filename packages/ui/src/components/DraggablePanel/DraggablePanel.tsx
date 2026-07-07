'use client';

import { GripVertical } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

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
  className?: string;
}

export function DraggablePanel({
  left,
  right,
  defaultSplit = 55,
  min = 25,
  max = 75,
  className,
}: DraggablePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(defaultSplit);
  const [dragging, setDragging] = useState(false);

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
        'rounded-square border-bone bg-white flex w-full items-stretch overflow-hidden border',
        dragging && 'select-none',
        className,
      )}
    >
      <div className="min-w-0 overflow-auto" style={{ width: `${split}%` }}>
        {left}
      </div>

      {/* The drag handle — a slim bone rail carrying the frame-7/8 grip: a
          small **stone-gray circle** with a soft card shadow and the dark ⋮⋮
          dots (one of the few vetted-round elements in the kit). Re-sampled
          frame 7 at 1px: the face is #dcdbd6–#e6e2df — the stone token —
          NOT limestone, which had no contrast against the panes.
          A native <button> carries the separator semantics so it's focusable
          and keyboard-operable without fighting the a11y linter. */}
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
          'group bg-bone p-0 relative flex w-px shrink-0 cursor-col-resize items-center justify-center',
          'outline-none',
        )}
      >
        <span
          data-testid="drag-grip"
          className={cn(
            // Frame 7 at 10x + 1px sampling: a circular STONE chip, soft
            // shadow, ink dots — no border; a full step darker than the
            // panes so it keeps contrast on the limestone canvas too.
            'size-7 rounded-pill bg-stone text-ink absolute flex items-center justify-center',
            'shadow-card group-hover:shadow-popover group-focus-visible:shadow-popover transition-shadow',
            dragging && 'shadow-popover',
          )}
        >
          <GripVertical size={14} />
        </span>
      </button>

      {/* Right pane = the preview CANVAS. Frames 7/8/10 sample #f6f5f1–#fbfaf6
          out there — the warm limestone wash the white invoice sheet floats
          on — never the same white as the form pane. */}
      <div className="min-w-0 bg-limestone flex-1 overflow-auto">{right}</div>
    </div>
  );
}
