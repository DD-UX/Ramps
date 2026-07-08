# React client patterns

Conditional reading. This is the _rare-but-sharp-edge_ companion to
[AGENTS.md](../AGENTS.md) — read it only when you touch one of these subjects.
The everyday rules (Server Components by default, server → client via the
provider) live in AGENTS.md under `apps/web`; this file is the small set of
gotchas that bit a session and are worth writing down once.

---

## 1. React 19 `<Activity>` and its `mode`

`<Activity>` (React 19) is how a tab keeps a hidden panel's **state** instead of
unmounting it: `mode="visible"` renders normally, `mode="hidden"` detaches the
subtree from the DOM and tears its effects down **without** unmounting — so the
panel's local state survives being switched away from and back.

Two edges caught us:

- **React does _not_ export a named `ActivityMode` type.** `mode` is an inline
  union on `ActivityProps` (`"hidden" | "visible" | undefined`). Don't invent an
  import for it — derive from the component's own prop type so it can never drift:

  ```ts
  import type { ActivityProps } from 'react';
  type ActivityMode = NonNullable<ActivityProps['mode']>; // 'visible' | 'hidden'
  ```

- **Name the modes; never spell the raw strings inline.** Per the values-first
  rule, back a const map with that derived type so a widened React union fails to
  compile until the map is updated:

  ```ts
  export const ACTIVITY_MODE = {
    VISIBLE: 'visible',
    HIDDEN: 'hidden',
  } as const satisfies Record<string, ActivityMode>;
  ```

  Lives at `apps/web/src/features/common/constants/activity.constants.ts`.

## 2. `cn` — the design system's className merge

`packages/ui` exposes `cn` on its own subpath: **`import { cn } from '@ramps/ui/cn'`**
(there is no barrel — the subpath is declared in `packages/ui/package.json`'s
`exports` map, like every other kit entry).

Use it — not a bare template literal or `clsx` alone — whenever a component merges
a caller's `className` over a base. `clsx` only _concatenates_: it doesn't know
`bg-accent` and `bg-white` are the same CSS property, so a passed `className`
wins or loses by CSS source order, not intent. `cn` is `twMerge(clsx(...))`, and
the twMerge is **extended** so it understands this system's bespoke scales:

- the `rui-*` spacing scale (`px-rui-3 px-rui-2` → `px-rui-2` wins), and
- the two radius names (`rounded-square` / `rounded-pill`) as one conflict group.

Without the extend, twMerge treats `rui-3` as unknown and lets both survive — the
exact bug the helper exists to kill. So the base classes go first, the caller's
`className` last:

```tsx
import { cn } from '@ramps/ui/cn';
<div className={cn('px-rui-5 py-rui-4 gap-rui-4 flex flex-col', className)} />;
```

## 3. Value-maps over native `enum` — even for a tab picker's `value`

The values-first rule (AGENTS.md → TypeScript) holds even where a native TS
`enum` looks tempting, e.g. a set of tab ids. The design system's `Tabs` takes a
plain `string` `value`; a native `enum` introduces a _nominal_ type that fights
that structural `string` prop and forces casts at every call site. Use the same
`as const` value-map → derived-type pattern instead:

```ts
export const BILL_DETAILS_TAB = { OVERVIEW: 'overview', ACTIVITY: 'activity' } as const;
export const BILL_DETAILS_TABS = [
  { value: BILL_DETAILS_TAB.OVERVIEW, label: 'Overview' },
  { value: BILL_DETAILS_TAB.ACTIVITY, label: 'Activity' },
] as const;
export type BillDetailsTab = (typeof BILL_DETAILS_TABS)[number]['value'];
```

The map is the single source of truth; the `_TABS` array the picker renders and
the `type` the state is keyed by both derive from it, so they can't drift onto
different literals.
