/**
 * The shared `layoutId` of the rail's floating active background — one id,
 * mounted by exactly one card at a time, so motion's shared layout animates
 * the limestone pill BETWEEN cards instead of fading it in/out per card.
 * Scoped by the `LayoutGroup` in {@link ../context/RailActive.context}.
 */
export const RAIL_ACTIVE_LAYOUT_ID = 'bill-details-rail-active';

/**
 * How long ↑/↓ skimming settles before the rail COMMITS a navigation.
 *
 * Arrow keys move the optimistic pill instantly, one card per press; the
 * route change (a real server-side hop) only fires once the presses stop for
 * this window — so holding/tapping through five bills costs one navigation,
 * not five. Tuned to sit comfortably past an unhurried tap cadence: a 300ms
 * window fired mid-skim (the spinner flashing before the user had settled),
 * so it's widened to let a deliberate press-pause-press still land as one hop
 * while a lone press stays responsive.
 */
export const RAIL_NAV_DEBOUNCE_MS = 500;
