# AGENTS.md — `@ramps/ui` (the design system)

Scoped rules for working **inside `packages/ui`**. Augments the root
[AGENTS.md](../../AGENTS.md); the design-system section there (tokens-only,
identity invariants, one-folder-per-component, stories-or-not-done) still applies.

## The golden rule: the kit is served, not just built

`/design-system` in the web app embeds a **static Storybook copy** at
`apps/web/public/storybook`. That copy is a _build artifact_ — it does NOT update
when you edit a component. If you add/rename/remove a component or story and don't
rebuild it, the running app shows a **stale** design system (e.g. a new `Avatar`
is invisible at `/design-system` even though its story exists).

**Therefore: any change under `packages/ui/src` — new component, new/edited story,
token change, export change — MUST be followed by rebuilding the embedded
Storybook before you consider the change done or commit it.**

```bash
# from the repo root (canonical):
pnpm --filter @ramps/ui sync:web        # rebuild the copy the web app serves

# equivalently, the web prebuild does the same on a full build:
pnpm --filter web build                 # runs prebuild → build:storybook
```

`sync:web` writes to `../../apps/web/public/storybook`. After it, reload
`/design-system` and confirm your component appears.

> Dev note: `pnpm --filter web dev` serves whatever is _currently_ in
> `public/storybook`. It does not regenerate it. Run `sync:web` after kit edits
> even in dev, or run `pnpm --filter @ramps/ui storybook` (port 6006) for a live
> workbench while iterating.

## Definition of done for a kit change

Run these, in order, and only stop when all pass:

```bash
pnpm --filter @ramps/ui lint
pnpm --filter @ramps/ui typecheck
pnpm --filter @ramps/ui sync:web        # ← the easy-to-forget step
bash .claude/skills/design-system-validate/validate.sh   # token-fidelity gate + advisory
```

- **lint + typecheck** — clean (`noUncheckedIndexedAccess` is on; guard array access).
- **sync:web** — the embedded `/design-system` Storybook is rebuilt.
- **validate gate** — `build-storybook` (HARD) → token-fidelity (HARD) →
  visual-advisory (advisory). Exit 0 = safe. Never bypass the hard gate.

A change that skips `sync:web` is **not done**, no matter how green the tests are —
the gate validates the kit, but the _app_ serves the stale copy.

## Component prop conventions

- **`children` → use `PropsWithChildren`, never a hand-written `children: ReactNode`.**
  Wrap the props interface: `type FooProps = PropsWithChildren<{ tone?: Tone }>`
  (or `PropsWithChildren` alone when there are no other props). This keeps the
  `children` typing consistent (optional `ReactNode`) across the kit and avoids
  drift. Import it from `react`: `import type { PropsWithChildren } from 'react'`.
- Still export a named props interface/type for every component (docs + reuse).

## Adding a component (checklist)

1. `src/components/<Name>/<Name>.tsx` — tokens-only, `clsx`, variant lookup maps,
   `PropsWithChildren` for any `children`, JSDoc citing the Ramp frame it came from.
2. `src/components/<Name>/<Name>.stories.tsx` — `title: 'Primitives/<Name>'`,
   default/hover/focus/disabled/loading where relevant. No stories → not done.
3. Add the subpath export to `package.json` (`"./<Name>": { types, import }`).
4. Extend `validation/design-token-fidelity.spec.ts` if the component asserts an
   identity invariant (e.g. destructive/critical must be the **orange** token,
   never red).
5. Run the **definition of done** block above (including `sync:web`).

## File naming: never name a file a bare "token(s)"

graphify's secret-hygiene heuristic **silently skips** any file whose name reads
as a bare `token`/`tokens` word (e.g. `Tokens.stories.tsx`, `tokens.fixture.ts`,
`token-fidelity.spec.ts`) — it never enters the knowledge graph, with no warning.
That's why this package has `DesignTokens.stories.tsx`, `rui.fixture.ts`, and
`design-token-fidelity.spec.ts`. Prefix or fuse the word (`design-token-…`,
`tokensheet`) so new files stay graph-visible. (`src/tokens/tokens.css` is exempt:
graphify never extracts CSS, so its name doesn't matter.)
