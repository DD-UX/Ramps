# Ramps

A payables (accounts payable) product inspired by [Ramp Bill Pay](https://support.ramp.com/hc/en-us/articles/27579228841875-Managing-bills-and-payments-on-Bill-Pay),
built end-to-end as a take-home assignment — data models, backend, frontend, and a
faithful reproduction of the Ramp design system.

> **Status:** planning & design research complete — implementation starting.
> This README will grow into the full submission doc (setup, workflows, decisions).

The core loop being built:

```
Invoice arrives ──▶ Bill created ──▶ Approval routing ──▶ Payment scheduled ──▶ Paid ──▶ History/audit
   (upload/OCR)      (draft, needs      (chain of            (ACH / check /       (reconciled,
                      review/coding)     approvers)            wire / card)         exportable)
```

## Documentation

| Doc | What's inside |
|---|---|
| [Assignment brief](docs/assignment.md) | The original prompt: scope a sensible MVP of a payables product, Ramp Bill Pay as inspiration, Ramp design system as the baseline (design-engineer track). "We care as much about what you build as how you build it." |
| [Analysis & execution plan](docs/ANALYSIS.md) | Product understanding of the AP domain (bill lifecycle as a state machine, bills vs. payments as separate objects), MVP scope with explicit cuts, monorepo architecture with zod as the single source of truth, data model, week plan, and risks. |
| [Design system research & playbook](docs/design-system.md) | Ramp's design language reverse-engineered from primary sources: the Ryu token sheet (~290 tokens extracted from shipped bundles), TWK Lausanne typography (body weight 300, `ss01`), verified palette with color swatches, validation of third-party claims, and the Storybook playbook for `packages/ui`. |

## Highlights from the research

- Ramp's internal design system is **Ryu** (web) / **Mew** (mobile) — never open-sourced,
  but its complete style-dictionary token sheet ships to the browser, and was extracted
  and verified against Ramp's live CSS.
- Typeface: **TWK Lausanne** — reproduced here with **Inter**, which is Ryu's *own*
  declared fallback stack (`Lausanne, Inter, Roboto, Arial`).
- Identity traits preserved: lime accent ![#e4f222](docs/assets/swatches/e4f222.svg) `#e4f222`
  always paired with ink ![#1a1919](docs/assets/swatches/1a1919.svg) `#1a1919`, warm
  limestone surfaces ![#f4f2f0](docs/assets/swatches/f4f2f0.svg) `#f4f2f0`, and an
  **orange** destructive family ![#ff7a36](docs/assets/swatches/ff7a36.svg) `#ff7a36` —
  no pure red anywhere.

## Planned architecture

```
ramps/
├── apps/
│   └── web/          # Next.js (App Router) — pages, route handlers, server actions
├── packages/
│   ├── ui/           # Ramp design system: tokens, components (+ Storybook)
│   ├── schemas/      # Zod schemas + inferred types — single source of truth
│   ├── sdk/          # Typed API client consuming the schemas
│   └── config/       # Shared tsconfig / eslint / tailwind preset
├── supabase/         # Migrations, seed with realistic demo data
└── docs/             # Everything linked above
```

Contracts are defined once in zod: compile-time types via `z.infer`, runtime validation
at every boundary (API input/output, forms), with Postgres enums and constraints kept
in lockstep.
