# Ramps

A payables (accounts payable) product inspired by [Ramp Bill Pay](https://support.ramp.com/hc/en-us/articles/27579228841875-Managing-bills-and-payments-on-Bill-Pay),
built end to end as a take-home assignment: data models, backend, frontend, and a
faithful reproduction of the Ramp design system.

## Live demo

- **App:** https://ramps-web.vercel.app/
- **Design system (Storybook):** https://ramps-web.vercel.app/storybook/index.html

The deployed app is **fully functional and needs zero setup**, and it is the
easiest way to try the whole flow (create a bill, approve it, schedule it, pay).

Running **locally** additionally requires **Supabase environment variables**
(the API URL and keys) so the app can reach the database; without them the web
app can't start. Copy them into `apps/web/.env.local`, or spin up the local
stack via the [Supabase setup runbook](docs/supabase-setup.md). If you just want
to test the product, use the hosted app link above instead.

> **Status:** shipped. The golden path (create a bill, approve it, schedule the
> payment, watch it pay) runs end to end against a real Postgres backend, and it
> is on-brand from the first pixel. What follows is how the product actually
> ended up, not how it was originally scoped.

The core loop that shipped:

```
Bill created ──▶ Coded & reviewed ──▶ Approval routing ──▶ Payment scheduled ──▶ Paid
 (draft /          (line items,         (compound chain      (ACH, guarded         (settled;
  missing_info)     GL/dept coding)      of roles + users)    scheduled→paid)       archivable)
```

Every arrow is a server-guarded transition (`BILL_STATUS_TRANSITIONS`): an
illegal move returns a 409 instead of a silent write. The nine lifecycle states
(`draft`, `missing_info`, `awaiting_approval`, `approved`, `scheduled`,
`partially_paid`, `paid`, `rejected`, `archived`) are the spine the whole UI is
keyed off.

## Documentation

| Doc                                                        | What's inside                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Assignment brief](docs/assignment.md)                     | The original prompt: scope a sensible MVP of a payables product, Ramp Bill Pay as inspiration, Ramp design system as the baseline (design-engineer track). "We care as much about what you build as how you build it."                                                                                     |
| [Analysis & execution plan](docs/ANALYSIS.md)              | Product understanding of the AP domain (bill lifecycle as a state machine, bills vs. payments as separate objects), MVP scope with explicit cuts, monorepo architecture with zod as the single source of truth, data model, week plan, and risks.                                                          |
| [Feature roadmap](docs/roadmap.md)                         | Every Ramp Bill Pay capability we digested (from the brief + its reference image) mapped to a build decision (In, Simulated, Nice-to-have, or Cut), plus the phase-by-phase execution sequence from empty repo to shippable demo.                                                                          |
| [Design system research & playbook](docs/design-system.md) | Ramp's design language reverse-engineered from primary sources: the Ryu token sheet (~290 tokens extracted from shipped bundles), TWK Lausanne typography (body weight 300, `ss01`), verified palette with color swatches, validation of third-party claims, and the Storybook playbook for `packages/ui`. |

## What shipped

The scope contract lives in [`docs/roadmap.md`](docs/roadmap.md) (🟢 In, 🟡
Simulated, 🔵 Nice-to-have, ⚪ Cut). This is where each decision actually landed
once the code was written.

### In: built for real

- **Bills workspace** (`/bills`), the centerpiece. A dense AP table with
  lifecycle tabs (driven off a `bill_tabs` lookup, not hardcoded), server-side
  search (`?q=` runs an `ILIKE`), pagination (`?page=`), and status pills. It is
  all URL state, so every view is shareable and re-runs on the server.
- **Bill lifecycle state machine**: nine statuses with a server-guarded
  transitions map (`BILL_STATUS_TRANSITIONS`). Every write re-reads the bill,
  checks the move, and rejects an illegal one with a 409. This is the spine of
  the whole product.
- **Bill detail** (`/bills/[id]`): the rendered invoice PDF sits side-by-side
  with an editable form (react-hook-form plus zodResolver). It has a per-status
  footer primary (Create, Approve, Schedule, Complete payment, View) fired by
  button or by ⌘/Ctrl+Enter, an edit-lock and cancel-edit pair, an
  unsaved-changes guard, and an overflow menu (Archive, Reject) whose items are
  derived from the transition map.
- **Create a bill**: a one-click demo generator (`createDemoBill`) that
  fabricates a plausible bill from the live catalog (real vendors, entities,
  users, and GL/department coding, never hardcoded ids), draws a complete
  invoice PDF with `pdf-lib`, and uploads it to Supabase Storage. A coin flip
  picks `draft` versus `missing_info` and whether a PO number is present, so a
  tester exercises both paths.
- **Approval routing** (`/approvals`, the `ApprovalsWorkflow` primitive):
  compound an approval chain from roles and users; stages persist through the
  `approval-stages` route.
- **Payments (simulated rails)**: schedule a payment (ACH), then Complete
  payment settles the live payment row and rolls the bill from `scheduled` to
  `paid`, guarded so a bill not on `scheduled` returns a 409. Real status
  progression, no real money.
- **Vendors** (`/vendors`): a list with tabs and search plus a per-vendor
  `total_spend_cents` rollup summed from its bills, built as the sibling of
  `/bills`.
- **Line-item coding**: per-line GL account, department, and dimensions, seeded
  with `external_id` provenance for a future accounting seam.
- **Design system** (`/design-system`), the graded deliverable. Ramp's Ryu
  tokens and primitives, reproduced in `packages/ui` and shipped as a Storybook
  built into the same deploy (one URL, no second host). See below.
- **Zod as the single source of truth**: schemas define compile-time types
  (`z.infer`) and runtime validation at every boundary, with Postgres enums and
  constraints kept in lockstep and seeded with a story-telling dataset.
- **Product polish**: per-page browser titles matching each SideMenu item, a
  brand favicon (lime tile with ink lockup), and a "looking for Bill Pay?" joke
  page so no sidebar route dead-ends on a 404.

### Out: cut or faked (and why)

- **Real OCR and invoice upload.** The create flow is a server-side generator,
  not an upload-then-OCR extractor. The wow of a rendered PDF stays; the parsing
  pipeline was cut, since a real extractor has no demo value at this scale.
- **Real payment rails.** There is no ACH, check, or wire integration. Payments
  are a status simulation, not money movement.
- **Reopen and restore UI.** The model supports the reverse edges, but the
  buttons were deliberately removed, so `archived` reads as terminal in the UI.
- **AP email forwarding** (`@ap.ramp.com`), **recurring bills**, **CSV bulk
  upload and export**, **AP aging report**, and **line-item splits.** These are
  roadmap-aware but not built: some need inbound-email or scheduler infra, and
  the rest are nice-to-haves that lost to the golden path and the design system.
- **Accounting sync, multi-entity, international FX, and mobile.** Out of scope,
  documented in the roadmap for awareness only.
- **Non-Bill-Pay nav destinations.** Home, Insights, Expenses, Travel,
  Accounting, Policy, Company, and the rest are real routes (so the nav never
  dead-ends) but land on the joke page. Only Bill Pay, Vendors, Approvals, and
  the Design System are wired to content.

## Highlights from the research

- Ramp's internal design system is **Ryu** (web) and **Mew** (mobile). It was never
  open-sourced, but its complete style-dictionary token sheet ships to the browser, and
  was extracted and verified against Ramp's live CSS.
- Typeface: **TWK Lausanne**, reproduced here with **Inter**, which is Ryu's _own_
  declared fallback stack (`Lausanne, Inter, Roboto, Arial`).
- Identity traits preserved: lime accent ![#e4f222](docs/assets/swatches/e4f222.svg) `#e4f222`
  always paired with ink ![#1a1919](docs/assets/swatches/1a1919.svg) `#1a1919`, warm
  limestone surfaces ![#f4f2f0](docs/assets/swatches/f4f2f0.svg) `#f4f2f0`, and an
  **orange** destructive family ![#ff7a36](docs/assets/swatches/ff7a36.svg) `#ff7a36`,
  with no pure red anywhere.

## Architecture

```
ramps/
├── apps/
│   └── web/          # Next.js (App Router): pages, route handlers, features/
├── packages/
│   ├── ui/           # Ramp design system: tokens, components (+ Storybook)
│   ├── schemas/      # Zod schemas + inferred types (single source of truth)
│   ├── sdk/          # Typed server/client halves consuming the schemas
│   └── config/       # Shared tsconfig / eslint / tailwind preset
├── supabase/         # Migrations, seed with realistic demo data
└── docs/             # Everything linked above
```

The web app is split into two route groups: `(shell)` holds the SideMenu and
TopBar list/overview surfaces, and `(detail)` holds the focused bill view.
Server Components read the DB through the SDK's server half (the admin client),
and writes go through `/api/bills/*` route handlers (`submit`, `approve`,
`schedule`, `roll`, `archive`, `reject`) that call the same SDK. Feature code is
organized by domain under `apps/web/src/features/`, with a components, hooks,
context, constants, helpers, and types layout per domain.

Contracts are defined once in zod: compile-time types via `z.infer`, runtime validation
at every boundary (API input/output, forms), with Postgres enums and constraints kept
in lockstep.

## Developer tooling

### Static analysis (fallow)

The same philosophy that keeps the design system honest (verify, don't trust)
applies to the code itself. We run [**fallow**](https://docs.fallow.tools)
(`npx -y fallow`) as the consistency check:

- **`fallow dupes`** runs suffix-array clone detection, used to hunt repetition
  the way the token gate hunts color drift. It caught copy-pasted story fixtures
  in `Table.stories.tsx`, which were extracted into shared `makeBill()` and
  column-builder helpers. The final pass sits at **3.8% duplication (775 lines
  across 24 clone groups)**, and most of it is deliberate: the `/bills` and
  `/vendors` toolbar and tab pair (built as siblings on purpose), the thin
  per-status API route handlers that share a parse, guard, and respond shape,
  and the `invoice-pdf` helper mirrored in its one-off seed script. Not zero,
  and reported honestly rather than hidden.
- **`fallow dead-code`** flags unused dependencies and unreachable exports (it's
  how we know what's actually wired up, not just declared).
- **`fallow health`** gives maintainability scoring and refactoring targets per
  file (`packages/ui` sits at 96/100).

Run from the package you're touching (e.g. `packages/ui`) before a push, the
same way the design-system gate runs before a push: duplication and dead code
are treated as drift, not decoration.

### AI skills

Third-party agent skills are tracked by `skills-lock.json` (source + content hash),
the same way `pnpm-lock.yaml` pins packages. The skill files themselves are **not**
committed, so materialize them locally from the lockfile:

```bash
npx skills add          # installs every skill pinned in skills-lock.json
```

This writes to `.agents/skills/` with a symlink under `.claude/skills/` (both
gitignored). Currently pinned:

| Skill                                                  | Why                                                                                                                                                                         |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`supabase/server`](https://skills.sh/supabase/server) | Guardrails for server-side Supabase (`@supabase/server`): auth modes and the **new** API keys (`sb_publishable_…` / `sb_secret_…`), not the legacy `anon` / `service_role`. |

### Knowledge graph (graphify)

The repo carries a persistent knowledge graph in `graphify-out/` (gitignored)
that agents query instead of re-reading the codebase. Git hooks keep it in
sync automatically, but hooks live in `.git/hooks` and never travel with a
clone, so **run this once per fresh clone**:

```bash
graphify hook install   # post-commit + post-checkout auto-rebuild (AST-only, no LLM)
```

After that, every commit and branch switch rebuilds the graph in the
background. Doc/frame changes still need a manual `/graphify --update`
(that path uses an LLM; code extraction is free). One naming caveat, banned
in [`packages/ui/AGENTS.md`](packages/ui/AGENTS.md): never name a file a bare
`token(s)` word, because graphify's secret-hygiene heuristic silently drops it.

### Hand-authored skills (built for this project)

The rest of the skills live in-tree under `.claude/skills/` and are committed
normally. Each one was written **for this project specifically**, mostly to
fight _context rot_: long agent sessions degrade as their context fills with
stale tool output, so the workflow is factored into skills that either persist
knowledge outside the session or gate the work mechanically.

| Skill                                                                      | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`watch-youtube`](.claude/skills/watch-youtube/SKILL.md)                   | The research workhorse: downloads a Ramp walkthrough video, extracts frames, and lets the agent _watch_ them (not just read a transcript), then commits the frames as documentation next to the design-system research. Ships a URL-timestamp mode to grab a single frame at a precise moment. First artifact: [`docs/watch-youtube/ramp-bill-pay-series-ap-agent/findings.md`](docs/watch-youtube/ramp-bill-pay-series-ap-agent/findings.md). Every component in `packages/ui` is vetted against these frames at pixel zoom before it ships. |
| [`handoff-set`](.claude/skills/handoff-set/SKILL.md)                       | The context-rot antidote, half one: distills a long session into a gitignored `handoff.md` (Goal / Current State / Active Files / Changes Made / Failed Attempts / Next Steps) so the _work_ survives even when the session's context doesn't.                                                                                                                                                                                                                                                                                                |
| [`handoff-take`](.claude/skills/handoff-take/SKILL.md)                     | Half two: a fresh session reads `handoff.md`, **verifies it against the actual repo state** (never trusts the note blindly), asks clarifying questions _before_ touching anything, then rebuilds the todo list and resumes. Together the pair replaces one rotting mega-session with a chain of sharp ones.                                                                                                                                                                                                                                   |
| [`design-system-validate`](.claude/skills/design-system-validate/SKILL.md) | The pre-push gate for `packages/ui`: builds the static Storybook, runs the **token-fidelity hard gate** (computed styles must resolve to the verified `--rui-*` tokens, and a failure blocks the push) plus a visual-advisory pass that captures the component gallery side-by-side with the curated Ramp video frames.                                                                                                                                                                                                                       |
| [`create-feature`](.claude/skills/create-feature/SKILL.md)                 | Scaffolds a new feature folder under `apps/web/src/features/` with the house category layout (components, hooks, context, constants, helpers, types) so every domain starts consistent.                                                                                                                                                                                                                                                                                                                                                       |
