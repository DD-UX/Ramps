# Ramps — Feature Roadmap

Two things live here:

1. **Feature catalog** — every Ramp Bill Pay capability we digested (from the
   assignment brief + its "Bill Creation and Management" reference image, cross-checked
   against `support.ramp.com`), mapped to an explicit build decision. This is the
   scope contract.
2. **Execution sequence** — the ordered plan of *how* we build it, from empty repo to
   shippable demo. Deliberately more detailed than the work is long: planning is cheap,
   thrash is expensive.

Scope rationale and the week-level view live in [`ANALYSIS.md`](./ANALYSIS.md) (§3 Scope,
§7 Week plan); this doc is the feature-grained companion.

> **Living doc.** The execution sequence should be *extended* as we go — each phase below
> will spawn finer steps (e.g. "kick off models and relationships" → "seed the DB with
> fake data to establish the relationships" → "expose them through the SDK" → …). Add
> detail just ahead of doing the work.

---

## 1. Feature catalog

**Legend:** 🟢 **In** (build real) · 🟡 **Simulated** (real UX, faked backend) ·
🔵 **Nice-to-have** (only if ahead of schedule) · ⚪ **Cut** (documented as out-of-scope)

### A. From the assignment image — "Bill Creation and Management"

These are Ramp's own documented Bill Pay sub-capabilities, verbatim from the reference
screenshot shipped with the brief.

| # | Ramp capability | What it means | Decision | Rationale |
|---|---|---|---|---|
| 1 | **Bill Pay OCR** | Scan/parse invoice → prefill fields | 🟡 Simulated | Fixture-based fake behind an interface; unknown uploads → `missing_info`. Real extractor slots in later. Core to the create-bill "wow." |
| 2 | **Line-item splits & allocation templates** | Split one line across multiple GL codes | 🔵 Nice-to-have | `bill_line_items` accommodates it in the model; split UI only if ahead. Allocation templates cut. |
| 3 | **AP email forwarding** (`@ap.ramp.com`) | Dedicated inbox; vendors email invoices in | ⚪ Cut | Real inbound-email infra, no demo value. Roadmap line in README. |
| 4 | **Spreadsheet (CSV) upload of bills** | Bulk-create bills from a sheet | 🔵 Nice-to-have | Cheap to fake (parse CSV → draft bills); good bulk story if time. |
| 5 | **Managing bills** (filters, sorts, bulk) | The dense AP table | 🟢 **In — centerpiece** | This *is* the product. DataTable with lifecycle tabs, filters, sort, bulk select. |
| 6 | **Creating draft bills** | Upload → draft → review/code | 🟢 In | The create-bill flow; pairs with OCR (#1). |
| 7 | **Uploading invoices/bills** | Multiple upload entry points | 🟢 In (one path) | Single upload path real; email/CSV entry points cut/nice. |
| 8 | **Invoice line items: expense vs. item** | Match lines to "expenses"/"items", sync to accounting | 🟡 Simplified | Model line items + GL category; skip the expense/item accounting-sync duality. |
| 9 | **Recurring bill payments** | Auto-create bills on a schedule | ⚪ Cut | Scheduler infra; roadmap line. One-off bills only. |
| 10 | **Bill lifecycle** | Status state machine + process controls | 🟢 **In — spine** | The state machine is our core domain flex; server-guarded transitions. |
| 11 | **AP Aging Report** | Outstanding payables by age bucket | 🔵 Nice-to-have | Highest-value nice-to-have; the finance artifact that signals real AP understanding. |

### B. The rest of the loop (implied by the product, not in the image)

| # | Capability | Decision | Rationale |
|---|---|---|---|
| 12 | **Approval routing** (rules → chain, approve/reject w/ comment) | 🟢 **In** | The "grok complex workflow" flex; rule-based + non-retroactive per Ramp. |
| 13 | **Payments** (ACH/check/wire, schedule, lifecycle sim) | 🟡 Simulated | Real UX + status progression (`scheduled→initiated→paid`, one seeded failure); no real rails. |
| 14 | **Vendors** (payment details, default coding, owner, bill history) | 🟢 In | First-class per Ramp; bills route off vendor config. |
| 15 | **Activity / audit log** | 🟢 In | `activity_events` from day one; powers the timeline UI. |
| 16 | **Roles / permissions / role switcher** | 🟢 In | Unified policy model (§9 open-question 2); demos authorization without authentication. |
| 17 | **Ramp design system reproduction** | 🟢 **In — baseline** | Design-engineer track; the actual graded deliverable, not styling. |
| 18 | **Dashboard / insights** (upcoming payments, AP aging) | 🔵 Nice-to-have | Overlaps #11. |
| 19 | **CSV export · saved views · remind approver** | 🔵 Nice-to-have | Pre-cut unless the golden path + design system are fully done. |
| 20 | Accounting sync · multi-entity · intl FX · mobile | ⚪ Cut | Roadmap awareness in README only. |

### The golden path (sacred — everything else is negotiable)

```
upload invoice ──▶ approve as approver ──▶ schedule payment ──▶ watch it pay
   (#1,6,7)            (#12,16)                 (#13)              (#10,13)
```

Nothing in the reference image forces a change to this path — it *validates* it.

---

## 2. Execution sequence

Ordered so that each phase unblocks the next and output compounds. Design system and data
model come before features (a design-engineer's screens must be on-brand from the first
pixel; features must have a schema + seed to render against). Extend each phase with finer
steps just before starting it.

### Phase 0 — Foundations ✅ *(done)*

- [x] Monorepo scaffold (`apps/web`, `packages/{ui,schemas,sdk,config}`, `supabase/`)
- [x] Node/pnpm pinned; typecheck/lint/build green across all workspaces
- [x] Design-system research (`docs/design-system.md`) + token extraction
- [x] Env samples, Supabase keys wired, MCP + skill tooling local
- [x] Architecture, scope, permissions model, roadmap documented

### Phase 1 — Data model & seed *(next)*

> "Kick off models and relationships" → "seed the DB to establish the relationships."

1. **Schemas first (`packages/schemas`)** — the SSoT. Zod enums + object schemas:
   `Policy` catalog, `Role`, `User`, `Vendor`, `Bill` (+ `BillStatus`), `BillLineItem`,
   `ApprovalPolicy`, `Approval`, `Payment` (+ `PaymentStatus`/`method`), `ActivityEvent`.
   Money as integer cents. Export `z.infer` types.
2. **Migrations (`supabase/migrations`)** — tables/enums/constraints mirroring the
   schemas 1:1; Postgres enums + CHECK constraints; RLS authored (defense-in-depth).
   Permissions tables: `policies`, `role_policies`, `user_policy_overrides`.
3. **Seed (`supabase/seed.sql`)** — realistic demo data that *tells a story*: ~15 vendors,
   ~40 bills across **every** lifecycle state (incl. overdue, one rejected, one failed
   payment), seeded users across roles **plus an off-AP employee placed on an approval
   chain** (to demo the approver = chain-membership path), seeded approval rules.
4. **One-command reset** — `supabase db reset` yields a fully demo-able DB.
5. **SDK surface (`packages/sdk`)** — typed read/write functions consuming the schemas;
   the app never touches the DB shape directly.

*Exit:* `db reset` + `pnpm typecheck` green; SDK can read a seeded bill with its vendor,
approvals, and payments.

### Phase 2 — Design system core + app shell

1. `tokens.css` (`--rui-*`) + Tailwind preset + Storybook tokens page.
2. Primitives (each = component + stories): Button, Input, Select, Badge/StatusPill,
   Checkbox, Tabs, Tooltip, Toast.
3. Structural: Sidebar/AppShell, PageHeader, Drawer, Modal.
4. **Role-switcher drawer** wired to the acting-role cookie + `router.refresh()`.

*Exit:* an empty but navigable app that already *looks like Ramp*; Storybook deployed.

### Phase 3 — Bills workspace + vendors

1. **DataTable** (TanStack headless): columns, sort, filter, selection, sticky header,
   empty/loading states, Ryu table metrics.
2. Bills workspace: lifecycle tabs (Needs review / Awaiting approval / Scheduled /
   History), status pills, bulk select.
3. Bill detail **drawer** (read-only first): invoice preview + fields + approval chain +
   activity timeline.
4. Vendors list + detail.

*Exit:* browse all seeded bills/vendors through the real UI.

### Phase 4 — Create bill + approvals

1. Upload → **simulated OCR** prefill → confirm form (react-hook-form + zodResolver).
2. Approval **rules** evaluated at submit → materialize `approvals` rows.
3. Approve/reject with comment; Approvals tab = bills where a row names the acting user.
4. **Settings tab** (admin-only, `policy.manage`) — the demo's "boom" lever.
5. Employee (non-AP) dashboard = redirect target.
6. Activity timeline writes.

*Exit:* the authorization story is demoable end-to-end from every seat.

### Phase 5 — Payments + lifecycle

1. Schedule payment (method picker, pay date) → `payments` row.
2. Payment **simulator**: `scheduled → initiated → paid` (timer or "advance clock");
   one seeded failure path.
3. Server-side **transition guards** (`transitionBill()` allowed-transitions map; illegal → 422).
4. Payments view.

*Exit:* the golden path runs start to finish; illegal transitions rejected.

### Phase 6 — Polish + realism

Empty/loading/error states everywhere · seed-data storytelling pass · microinteractions ·
a11y pass · nice-to-haves **only** if all above is done (priority: AP aging → line-item
splits → CSV export → saved views).

### Phase 7 — Ship

README (assignment's five bullets, in order) · design-opinions writeup · Vercel + hosted
Supabase deploy · **fresh-clone setup test on a clean machine** · screenshots/demo GIF · buffer.

---

## 3. Open questions that gate execution

Tracked in [`ANALYSIS.md` §9](./ANALYSIS.md#9-open-questions-to-settle-before-coding).
The only one touching the near-term path is **open-question 7** (the "boom" mechanic —
how a Settings edit reaches an already-created bill); it's deferred and does **not** block
Phase 1. Everything Phase 1 needs is settled.
