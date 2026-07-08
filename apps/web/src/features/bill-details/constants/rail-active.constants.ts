/**
 * The shared `layoutId` of the rail's floating active background — one id,
 * mounted by exactly one card at a time, so motion's shared layout animates
 * the limestone pill BETWEEN cards instead of fading it in/out per card.
 * Scoped by the `LayoutGroup` in {@link ../context/RailActive.context}.
 */
export const RAIL_ACTIVE_LAYOUT_ID = 'bill-details-rail-active';
