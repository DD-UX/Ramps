import type { MotionProps } from 'motion/react';

/**
 * Press motion — the shared "this control is pressable" recipe, spread onto any
 * `motion.button` so the whole kit reacts to pointer/press with ONE tuned feel.
 *
 * It's the interaction twin of {@link ../Toast/toastVariants}: plain data (no
 * React), colocated, spread at the call site. Both Button and IconButton spread
 * the SAME `PRESS` object, so a change here retunes every action primitive at
 * once — the reusable variant the design system asks for.
 *
 * ```tsx
 * <motion.button {...PRESS}>…</motion.button>
 * ```
 *
 * The feel: a light lift on hover (1.02) and a PRONOUNCED, tactile squash on
 * press (0.94 — the button visibly gives under the finger), settled by a snappy
 * spring so it bounces back without wobble. Scale-only, so it composes with any
 * variant's colour/shadow transitions and never fights layout.
 *
 * Disabled controls must NOT react — a `disabled` button has no press. Spread
 * {@link NO_PRESS} instead (empty) so the affordance disappears with the state.
 */
export type PressMotionPreset = Pick<MotionProps, 'whileHover' | 'whileTap' | 'transition'>;

/**
 * The DOM event-handler names whose React signatures collide with Motion's own
 * (Motion redefines `onAnimationStart` + the drag handlers to carry animation
 * definitions, not DOM events). Any component that renders a `motion.*` off
 * native element attributes should `Omit` these — none is used on our controls.
 */
export type MotionClashingHandlers =
  'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd';

/** Snappy, no-wobble settle — the same spring family as the Tabs/Segmented glide. */
const PRESS_SPRING = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
} satisfies MotionProps['transition'];

/** The active press feel: quiet hover lift, pronounced tactile squash on tap. */
export const PRESS = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.94 },
  transition: PRESS_SPRING,
} as const satisfies PressMotionPreset;

/** The inert counterpart — spread on a disabled control so it never reacts. */
export const NO_PRESS = {} as const satisfies PressMotionPreset;

/** Pick the right preset for a control's enabled/disabled state. */
export function pressPreset(disabled: boolean | undefined): PressMotionPreset {
  return disabled ? NO_PRESS : PRESS;
}
