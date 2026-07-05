# AGENTS.md

Technical rulebook for working in **ramps**. Read this before writing code.
Full reasoning lives in [docs/ANALYSIS.md](docs/ANALYSIS.md) (product, scope, architecture)
and [docs/design-system.md](docs/design-system.md) (verified Ramp tokens, Storybook playbook).
This file is the _how_; those are the _why_.

## What this repo is

A payables product (Ramp Bill Pay-inspired) built as a take-home: Next.js app +
Supabase, in a pnpm/Turborepo monorepo, with a reproduction of the Ramp design
system. The golden path is sacred: **upload invoice → OCR prefill (simulated) →
approval chain → schedule payment → paid** ([ANALYSIS §3](docs/ANALYSIS.md#3-scope)).

```
apps/web            Next.js (App Router) — pages, route handlers, server actions
packages/ui         Ramp design system: tokens + components + Storybook
packages/schemas    Zod schemas — the single source of truth for all models
packages/sdk        Typed API client consuming the schemas
packages/config     Shared tsconfig / eslint / tailwind preset
supabase/           Migrations + realistic seed data
```

## Operating mode

- **Be autonomous** for routine work (edits, install, build, test, lint); don't ask
  permission for safe commands. **Verify before declaring done** — run the relevant
  check, fix, re-run, report real status.
- **Recoverable changes only.** No destructive git/fs commands without explicit ask.
- **Commits:** conventional prefix, body explains _why_, atomic. **Never add a
  co-author line or AI attribution.**
- Docs and code never drift: scope/decision changes get reflected in `docs/`.

## Commands

```bash
pnpm dev                      # app + storybook via turbo
pnpm --filter web dev         # Next.js only
pnpm --filter ui storybook    # design system workbench
pnpm format                                # prettier --write (run after editing)
pnpm format:check && pnpm typecheck && pnpm lint && pnpm test   # before every commit
supabase start && supabase db reset        # local DB + migrations + seed
```

(Keep this section updated as scripts land — it is the contract for verification.)

---

## General rules of thumb (repo-wide)

### Formatting

- **Prettier is the source of truth for layout** (config in `.prettierrc.json`).
  Run `pnpm format` after editing any file, and `pnpm format:check` must pass
  before a commit. Never hand-format against it — no manual spacing/import
  ordering that the formatter would rewrite.

### TypeScript

- Strict TS everywhere; explicit types at boundaries; no `any`, no cast-fighting.
- `interface` → object shapes/props/contracts callers extend. `type` → unions,
  aliases, derived/mapped types.
- **Entities are `Model`-suffixed** and derive from zod — never hand-written:

```ts
// ✅ DO — schema is the source, model is derived
export const BillSchema = z.object({ id: z.string().uuid(), amountCents: z.number().int(), ... });
export type BillModel = z.infer<typeof BillSchema>;

// ❌ DON'T
interface Bill { id: string; amountCents: number }   // parallel truth, will drift
```

- **Reference entity props via indexed access**, never re-declare the primitive:

```ts
// ✅ DO
function payBill(billId: BillModel['id']) {}
// ❌ DON'T
function payBill(billId: string) {} // loses the link to the entity
```

- **Values first, types derived.** No hand-written unions that mirror a list:

```ts
// ✅ DO
export const BILL_STATUS = { draft: 'draft', awaitingApproval: 'awaiting_approval', ... } as const;
export const BillStatusSchema = z.enum(Object.values(BILL_STATUS));
export type BillStatusType = z.infer<typeof BillStatusSchema>;

// ❌ DON'T
export type BillStatusType = 'draft' | 'awaiting_approval';   // free to drift from DB enum
```

- Non-entity types are `Type`-suffixed (`BillStatusType`); component props are
  `XxxProps`. Key-based lookups use `Map` / `Record`, not `array.find` per lookup.

### Money & domain

- **Money is integer cents** (`amountCents: z.number().int()`) everywhere —
  storage, transport, math. Format only at the render edge (`MoneyText`).
- **State transitions are data, not ifs:** one allowed-transitions map, enforced
  server-side; illegal transition → 422 ([ANALYSIS §4](docs/ANALYSIS.md#4-architecture)).
- Every meaningful mutation writes an `activity_events` row.

### Components (React)

- Named `function` declarations; no arrow components; `default` export only for
  Next `page.tsx`/`layout.tsx` and Storybook meta.
- Props interface extends the element's props; destructure, spread `...props`,
  merge `className` last. Variant styling via lookup map, never ternary chains.
- `"use client"` only for state/effects/handlers — presentational components stay
  server-renderable.
- **`children` → `PropsWithChildren`, always.** When a component accepts children,
  type its props with React's `PropsWithChildren`. Never hand-write
  `children: ReactNode` or `children?: ReactNode` in the interface — it drifts from
  React's own type and trips Storybook CSF (a required `children` forces every
  render-only story to pass `args`). This is repo-wide (`apps/web` + `packages/ui`),
  not just the kit.

```tsx
// ✅ DO
import type { PropsWithChildren } from 'react';
export interface CardProps extends PropsWithChildren {
  title: string;
}
// ❌ DON'T
export interface CardProps {
  title: string;
  children: ReactNode;
}
```

### Files & naming

```
features/<feature>/
  components/  PascalCase.tsx, feature-prefixed (BillsTable, BillsStatusPill)
  hooks/       useCamelCase.ts
  context/     PascalCase.context.tsx (BillDraft.context.tsx)
  helpers/     kebab-case.helpers.ts
  constants/   kebab-case.constants.ts
  types/       kebab-case.types.ts
```

One category per file (no constants inside component files). Tests colocated:
`Foo.tsx` + `Foo.test.tsx`.

### Imports & module graph

- **Avoid barrels.** No `index.ts` files that re-export a folder. Import the
  concrete module (`@ramps/schemas/bill`, `./helpers/format-money.helpers`), not
  an aggregator. Barrels defeat tree-shaking and are the most common source of
  import cycles.

```ts
// ✅ DO — direct, specific
import { BillSchema } from '@ramps/schemas/bill';
// ❌ DON'T — barrel re-export
import { BillSchema } from '@ramps/schemas';
```

- **No cyclic dependencies**, at any level: not between packages, not between
  feature folders, not between files. If two modules need each other, the shared
  piece belongs in a third module they both import. Dependency direction is
  one-way: `schemas → sdk → ui/web`; a package never imports "upward".
- Packages expose an explicit `exports` map of subpaths; there is no catch-all
  entry point.

### Dependencies

- Every dependency must earn its place; prefer Radix primitives + hand-built
  components over kitchen-sink kits. Utilities you can write in 5 lines: write them.

---

## Per-project rules of thumb

### `packages/schemas` — the contract

Deep dive: [ANALYSIS §4 — contract flow & data model](docs/ANALYSIS.md#4-architecture)

- Everything that crosses a boundary has a schema here: entities, API
  inputs/outputs, form payloads. Name: `BillSchema`, `CreateBillInputSchema`.
- Schemas mirror the DB (enums/constraints in lockstep with `supabase/migrations`).
  When a migration changes an enum, the `as const` object changes in the same commit.
- No React, no fetch, no side effects in this package — pure zod + derived constants.

### `packages/ui` — the design system

Package rulebook: [packages/ui/AGENTS.md](packages/ui/AGENTS.md) — **read it before
editing the kit.** Deep dive: [docs/design-system.md](docs/design-system.md) — tokens §2,
Storybook playbook §6

- **The kit is served, not just built.** `/design-system` embeds a static Storybook
  copy at `apps/web/public/storybook`. It does **not** auto-update. After ANY change
  under `packages/ui/src`, rebuild it — otherwise the app shows a stale design system:

  ```bash
  pnpm --filter @ramps/ui sync:web    # then reload /design-system to confirm
  ```

- **Tokens only.** Components consume `--rui-*` custom properties (from the verified
  Ryu sheet). Zero hardcoded colors/sizes/radii:

```tsx
// ✅ DO
<span className="bg-[var(--rui-accent)] text-[var(--rui-ink)]" />
// ❌ DON'T
<span className="bg-[#e4f222] text-[#1a1919]" />   // magic hex, bypasses the system
```

- Identity invariants: lime accent always paired with ink; destructive = orange
  family, warning = mustard — **never introduce red**; body text weight 300;
  radii 4px (controls) / 12px (surfaces) / `100vmin` (pills).
- One folder per component: `src/components/Button/Button.tsx` with its stories
  colocated (`Button.stories.tsx`).
- **Every component ships with stories** covering default/hover/focus-visible/
  disabled/loading, passes the a11y addon, and links a reference Ramp screenshot.
  No stories → not done.
- No domain imports here (no schemas/sdk) — `ui` is presentational and app-agnostic;
  domain compositions receive data via props.

### `packages/sdk` — the typed client

Deep dive: [ANALYSIS §9.2 — data access decision](docs/ANALYSIS.md#9-open-questions-to-settle-before-coding)

- The only place `fetch` is called on the client. Every response is `.parse()`d
  with the schema before returning — the SDK returns `Model`s, never raw JSON:

```ts
// ✅ DO
const data = await http.get(`/api/bills/${id}`);
return BillSchema.parse(data);
// ❌ DON'T
return (await fetch(url)).json() as BillModel; // cast instead of runtime proof
```

- No React in the SDK. Hooks that wrap SDK calls live in the app's features.

### `apps/web` — the product

Deep dive: [ANALYSIS §3 scope](docs/ANALYSIS.md#3-scope), [§6 simulation strategy](docs/ANALYSIS.md#6-simulation-strategy-make-the-fakes-feel-real)

- Server Components by default; fetch data server-side for tables/pages.
- All mutations go through zod-guarded server code (route handlers / server
  actions). **No client-side Supabase access, ever** — DB shape is not the contract.
- Bill/payment status changes only via the transition helper — no direct status writes.
- Simulations (OCR fixtures, payment progression, role switcher) live behind clean
  interfaces so a real implementation could slot in; they are demo features, framed
  as such in the UI.
- Forms: react-hook-form + `zodResolver` with the same schema the endpoint parses.
- Empty/loading/error states are part of a screen's definition of done.

### `supabase/` — the database

Deep dive: [ANALYSIS §4 — data model](docs/ANALYSIS.md#4-architecture)

- Migrations are append-only SQL; enums + CHECK constraints defend the domain even
  if app code slips (money `int`, status enums, FK integrity).
- Seed data tells a story (~15 vendors, ~40 bills across every lifecycle state,
  one failed payment) and must survive `supabase db reset` as a one-command demo.
- Bills and payments are **separate tables** with independent status enums.

---

## Codebase navigation (graphify)

This project can carry a knowledge graph at `graphify-out/` (god nodes, community
structure, cross-file relationships). When `graphify-out/graph.json` exists, prefer
it over raw grep/file browsing:

- For codebase questions, run `graphify query "<question>"` first — it returns a
  scoped subgraph, usually far smaller than raw search output. Use
  `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"`
  for a focused concept.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review, or when
  query/path/explain don't surface enough context.
- After modifying code, run `graphify update .` to keep the graph current
  (AST-only, no API cost).
- The graph is generated output — `graphify-out/` is gitignored, not committed.

---

## Non-negotiables

- **`@ramp-ds/ui` / ramp-ds.vercel.app is off-limits** — not affiliated with Ramp,
  plausibly another candidate's submission
  ([evidence](docs/design-system.md#4-excluded-ramp-dsui-npm--ramp-dsvercelapp)).
- No Ramp logo/wordmark or TWK Lausanne font files in the repo — Inter (Ryu's own
  fallback) + token values only.
- No real integrations (payment rails, OCR, auth signup, accounting sync) — and no
  scope creep on the table (no virtualization/column-DnD) or approvals (thresholds
  only, no rule builder).
- No floating-point money. No client-side status mutations. No secrets or scraped
  bundle dumps committed.
