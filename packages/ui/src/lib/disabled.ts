/**
 * Shared disabled treatment for every interactive primitive.
 *
 * The bug this fixes: variants bake in `hover:bg-*` / `hover:text-*`
 * unconditionally, and the browser still fires `:hover` on a *disabled*
 * element — so a disabled control kept lighting up on hover, contradicting its
 * `not-allowed` cursor. The rule across the system is now: a disabled control
 * collapses to ONE consistent muted gray, drops all hover reaction, and reads
 * as inert.
 *
 * `stone` (#e3e0dd) is the neutral disabled surface; `hushed` the muted label.
 * The `disabled:hover:*` pair explicitly re-asserts that gray under the pointer
 * so no variant's `hover:bg-*` can win. Because primitives compose through
 * `cn()` (tailwind-merge), these land LAST in their conflict groups and reliably
 * override the variant fill + hover.
 *
 * Two forms, because the library mixes selectors:
 *  - `DISABLED_CONTROL` — native form controls exposing the CSS `:disabled`
 *    state (`<button>`, `<input>`, `<select>`): Button, IconButton, Input,
 *    Select, Checkbox, Table's pagination buttons.
 *  - `DISABLED_CONTROL_DATA` — Base UI primitives that mark disabled items with
 *    `data-disabled` instead (Menu, Dropdown items).
 *
 * Keep the two in lockstep; they are the same visual contract via different
 * selectors.
 */
const DISABLED_DECLS =
  'cursor-not-allowed bg-stone text-hushed border-transparent opacity-60' as const;

const HOVER_RESET = 'bg-stone text-hushed' as const;

/** Native `:disabled` controls. */
export const DISABLED_CONTROL =
  'disabled:cursor-not-allowed disabled:bg-stone disabled:text-hushed disabled:border-transparent disabled:opacity-60 disabled:hover:bg-stone disabled:hover:text-hushed' as const;

/** Base UI `data-disabled` items (Menu, Dropdown). */
export const DISABLED_CONTROL_DATA =
  'data-[disabled]:cursor-not-allowed data-[disabled]:bg-stone data-[disabled]:text-hushed data-[disabled]:border-transparent data-[disabled]:opacity-60 data-[disabled]:hover:bg-stone data-[disabled]:hover:text-hushed' as const;

// Exported for tests to assert the two selector forms stay in sync.
export const __DISABLED_DECLS = DISABLED_DECLS;
export const __DISABLED_HOVER_RESET = HOVER_RESET;
