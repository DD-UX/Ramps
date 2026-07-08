import type { MotionProps } from 'motion/react';

/**
 * The design system's press feel, mirrored for app surfaces.
 *
 * This is the SAME recipe `@ramps/ui`'s Button/IconButton spread
 * (`packages/ui/src/components/motion/pressVariants.ts`): a light lift on
 * hover (1.02), a pronounced tactile squash on press (0.94), settled by a
 * snappy no-wobble spring. Duplicated — not imported — because the package
 * doesn't export its motion presets yet and the DS is frozen right now;
 * when `@ramps/ui` exposes them, replace this file with that import so the
 * whole kit retunes from one object again.
 */
export const PRESS_MOTION = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.94 },
  transition: { type: 'spring', stiffness: 500, damping: 30 },
} as const satisfies Pick<MotionProps, 'whileHover' | 'whileTap' | 'transition'>;
