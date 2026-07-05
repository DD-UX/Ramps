import type { MotionProps } from 'motion/react';

/**
 * Toast motion presets — the spreadable enter/exit recipes for every screen
 * position a toast can live in.
 *
 * Classic three-phase variant objects (`initial` / `animate` / `exit`) so a
 * developer can pick one off the shelf and spread it:
 *
 * ```tsx
 * <Toast transition={TOAST_VARIANTS.slideBottomRight} title="Payment scheduled" />
 * ```
 *
 * Naming = WHERE the toast lives on screen. Motion is SINGLE-AXIS, never
 * diagonal: anything on the left/right (sides AND corners) slides in
 * horizontally from its vertical edge; the top/bottom-centre toasts drop
 * down / rise up. The centre position can't slide anywhere, so it grows
 * from the centre: a subtle scale (0.9 → 1) + fade.
 *
 * Exit mirrors the entry (back toward its edge, slightly faster ease-in) —
 * pair with Motion's `<AnimatePresence>` so unmounts play the exit.
 *
 * These are plain data — no React — so they're safe to import anywhere
 * (including the validation suite).
 */
export type ToastMotionPreset = Pick<MotionProps, 'initial' | 'animate' | 'exit' | 'transition'>;

/** How far off-position a sliding toast starts/ends, in px. */
const SLIDE_DISTANCE = 24;

/** Quick, quiet product motion: ease-out in… */
const ENTER = { duration: 0.2, ease: 'easeOut' } satisfies MotionProps['transition'];
/** …slightly faster ease-in out. */
const EXIT = { duration: 0.15, ease: 'easeIn' } satisfies MotionProps['transition'];

/** Build a slide preset from an initial (x, y) offset toward the toast's edge. */
function slide(x: number, y: number): ToastMotionPreset {
  return {
    initial: { opacity: 0, x, y },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x, y, transition: EXIT },
    transition: ENTER,
  };
}

/**
 * All 9 positions, laid out like the screen:
 *
 *   slideTopLeft     slideTop      slideTopRight
 *   slideLeft        popCenter     slideRight
 *   slideBottomLeft  slideBottom   slideBottomRight
 */
export const TOAST_VARIANTS = {
  slideTopLeft: slide(-SLIDE_DISTANCE, 0),
  slideTop: slide(0, -SLIDE_DISTANCE),
  slideTopRight: slide(SLIDE_DISTANCE, 0),
  slideLeft: slide(-SLIDE_DISTANCE, 0),
  popCenter: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: EXIT },
    transition: ENTER,
  },
  slideRight: slide(SLIDE_DISTANCE, 0),
  slideBottomLeft: slide(-SLIDE_DISTANCE, 0),
  slideBottom: slide(0, SLIDE_DISTANCE),
  slideBottomRight: slide(SLIDE_DISTANCE, 0),
} as const satisfies Record<string, ToastMotionPreset>;

export type ToastVariantName = keyof typeof TOAST_VARIANTS;
