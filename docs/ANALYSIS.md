# Ramps — Initial Analysis & Execution Plan

**Track:** Design engineer (Ramp design system reproduction is the *baseline*, not a bonus)
**Time budget:** ~1 week
**Guiding principle:** The first impression is the only impression. Every decision below is
optimized for what a reviewer experiences in their first 10 minutes: README → setup → demo
walkthrough → code skim.

---

## 1. Product understanding

Ramp Bill Pay is an **accounts payable (AP) automation** product. The job-to-be-done: a
finance team receives vendor invoices, needs to get them approved by the right people, pay
them through the right rails at the right time, and keep a clean audit trail for accounting.

The core loop (this is the spine of the whole product):

```
Invoice arrives ──▶ Bill created ──▶ Approval routing ──▶ Payment scheduled ──▶ Paid ──▶ History/audit
   (upload/OCR)      (draft, needs      (chain of            (ACH / check /       (reconciled,
                      review/coding)     approvers)            wire / card)         exportable)
```

Key domain insights from the Ramp docs (these are what "grokking the workflow" means):

1. **Bills and Payments are separate objects.** A bill is an obligation; a payment is a
   money movement. One bill → one or more payments, each with independent statuses.
   Modeling this correctly is a strong domain-understanding signal.
2. **The bill lifecycle is a state machine.** Ramp's statuses: `Missing info → Ready →
   Awaiting approval → Scheduled → Initiated → Paid`, plus terminal states `Rejected`,
   `Archived`, `Payment failed`. The UI is organized *around* this lifecycle (tabs:
   Drafts / Approvals / Payment / History) — the IA mirrors the state machine.
3. **Vendors are first-class.** Vendor records own payment details, default accounting
   coding, and a "vendor owner" (person responsible). Bills route based on vendor config.
4. **Approvals are policy-driven.** Rules like "bills over $5k require CFO approval"
   generate an approval chain per bill. Bulk approve and reminders exist because
   approver latency is the #1 real-world bottleneck.
5. **The table is the product.** AP clerks live in dense, filterable, bulk-editable
   tables with saved views. Table quality = UX quality here.

---

## 2. Evaluation criteria → strategy mapping

| Criterion | Our answer |
|---|---|
| Product taste | Organize IA around the bill lifecycle like Ramp does; realistic seed data that tells a story (overdue bills, a rejected bill, a failed payment) |
| Design/UI | Reproduce Ramp's design system as a real `packages/ui` with tokens + documented components; ship 2–3 written opinions on where Ramp's design falls short |
| Scope judgment | Explicit in/out list in README; cut real payment rails, real OCR, real auth — simulate all three convincingly |
| UX quality | Empty states, loading skeletons, optimistic updates, keyboard support in tables, toasts, drawer-based detail views (Ramp pattern) |
| Grok complex workflows | Correct state machine, bill↔payment separation, policy-driven approval chains, audit/activity log |
| Simple, robust systems | Zod as single source of truth, thin API layer, DB constraints + enums, state transitions validated server-side |
| Raw output | Monorepo scaffolding + design system built first so features compound fast in days 3–6 |

---

## 3. Scope

> The full feature-grained catalog (every Ramp Bill Pay capability we digested, mapped to
> In / Simulated / Nice-to-have / Cut) and the phase-by-phase execution sequence live in
> [`roadmap.md`](./roadmap.md). This section is the week-level summary.

### MVP — must ship (the golden path)

1. **App shell** — Ramp-style left sidebar nav, org/user switcher (fake), top bar.
2. **Bills workspace** — tabbed table (Needs review / Awaiting approval / Scheduled /
   History) with filters, sorting, status pills, bulk select. This is the centerpiece screen.
3. **Create bill flow** — upload invoice PDF/image → simulated OCR prefill (see §6) →
   edit/confirm form (vendor, amount, due date, invoice #, line items, GL category).
4. **Bill detail drawer** — invoice preview side-by-side with editable fields, approval
   chain visualization, activity timeline. This is the screen that shows design chops.
5. **Approval workflow** — approval policies (amount thresholds → approver chain),
   approve/reject with comment, role switcher to demo as approver ("View as CFO").
6. **Payments** — schedule payment (method: ACH / check / wire — simulated), pay date
   picker, payment lifecycle simulation (`Scheduled → Initiated → Paid`, with one
   seeded failure), separate Payments view.
7. **Vendors** — list + detail: payment method on file, default GL coding, vendor owner,
   bill history per vendor.
8. **Realistic seed data** — ~15 vendors, ~40 bills spread across every lifecycle state,
   real-looking invoice files, multiple users/roles. One `supabase db reset` gives a
   fully demo-able product.

### Nice-to-have — only if ahead of schedule (in priority order)

1. Bulk actions (bulk approve, bulk edit due date/GL)
2. Dashboard/insights (upcoming payments, AP aging summary)
3. CSV export
4. Saved table views
5. "Remind approver" action (writes to activity log)
6. Real LLM-backed invoice extraction behind the same interface as the fake

### Explicitly out of scope (and why — this list goes in the README)

- **Real payment rails** — no value in a demo; simulated status progression shows the
  same domain modeling without integration risk.
- **Real OCR** — deterministic fake keeps the demo reliable; interface designed so a
  real extractor slots in.
- **Real auth (signup/login)** — seeded users + a role switcher demos *authorization*
  (the interesting part: approver permissions) without burning a day on *authentication*.
- **Accounting sync (QuickBooks/NetSuite), multi-entity, intl FX, email invoice
  ingest, mobile** — noted as roadmap in README to show awareness.

---

## 4. Architecture

### Monorepo layout (pnpm workspaces + Turborepo)

```
ramps/
├── apps/
│   └── web/                  # Next.js (App Router) — pages, server actions/route handlers
├── packages/
│   ├── ui/                   # Ramp design system: tokens, primitives, composed components (+ Storybook)
│   ├── schemas/              # Zod schemas + inferred types — the single source of truth
│   ├── sdk/                  # Typed API client consuming schemas (used by web, testable alone)
│   └── config/               # Shared tsconfig / eslint / tailwind preset
├── supabase/
│   ├── migrations/           # SQL: tables, enums, constraints, RLS (basic)
│   └── seed.sql              # Realistic demo data
└── docs/                     # This analysis, assignment, design-system notes
```

**Justification (goes in README):** the SDK + schemas split isn't ceremony — it enforces
the contract story: zod schemas define models once; the DB, API handlers, SDK, and forms
all derive from them. Compile-time via `z.infer`, runtime via `.parse()` at every boundary
(API input, API output in dev, form submission).

### Contract flow

```
supabase (SQL enums/constraints)
        ▲  kept in lockstep with
packages/schemas (zod)  ──▶ z.infer types (compile time)
        │
        ├──▶ apps/web route handlers: parse input, validate transitions
        ├──▶ packages/sdk: typed client, parses responses
        └──▶ forms (react-hook-form + zodResolver)
```

### Data model (first cut)

```
users            (id, name, email, role: admin|accounts_payable|employee, avatar)
                  # Ramp-founded (support.ramp.com): role = Bill Pay *capability*.
                  # admin = Owner/Admin super-user; accounts_payable = the AP add-on
                  # (submit bills, manage vendors); employee = no Bill Pay by default.
                  # "Approver" is NOT a role — it is chain membership (see approvals):
                  # an admin-built policy names users (any role, incl. employee) as
                  # approvers, so an off-AP employee on a chain can approve that bill
                  # only, without submitting. Off any chain, employee hits the redirect.
                  # Effective policies = (role_policies ∪ included) \ excluded; see
                  # user_policy_overrides. §9 open-question 2 has the full model.
policies         (key)  # catalog of atomic capabilities (SSoT enum in packages/schemas):
                  # employee.all, billpay.view, bill.create, bill.submit, bill.edit,
                  # bill.approve, bill.pay, vendor.view, vendor.manage, payment.view,
                  # policy.manage, user.manage
role_policies    (role, policy_key)          # seeded: which policies each role sums to
user_policy_overrides
                 (user_id, policy_key, mode: include|exclude)  # per-user +/- (exclude wins)
vendors          (id, name, owner_id→users, default_payment_method, default_gl_account,
                  bank_details_json, status)
bills            (id, vendor_id, created_by, invoice_number, invoice_date, due_date,
                  amount_cents, currency, memo, gl_account, document_url,
                  status: draft|missing_info|awaiting_approval|approved|scheduled|
                          partially_paid|paid|rejected|archived)
bill_line_items  (id, bill_id, description, qty, unit_price_cents, gl_account)
approval_policies(id, min_amount_cents, approver_role/approver_id, sequence)
                  # Admin-configured routing (Ramp: submitter can NOT pick approvers;
                  # the workflow is auto-determined by admin rules). A step names a
                  # specific user OR a role/group; amount is the demo's routing condition.
approvals        (id, bill_id, approver_id, sequence, status: pending|approved|rejected,
                  comment, acted_at)
payments         (id, bill_id, method: ach|check|wire, amount_cents, scheduled_date,
                  status: scheduled|initiated|paid|failed, failure_reason)
activity_events  (id, bill_id, actor_id, type, payload_json, created_at)  # audit trail
```

Design notes:
- **Money as integer cents** — floating point money in a fintech take-home is disqualifying.
- **Status transitions validated server-side** — a `transitionBill()` function with an
  explicit allowed-transitions map; illegal transitions 422. Small, cheap, high-signal.
- **`activity_events` from day one** — powers the timeline UI and screams "audit trail
  matters in AP."
- Postgres enums + CHECK constraints so the DB defends itself even if app code slips.

### Stack decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js App Router, server components + route handlers | Required; server components keep the table pages fast |
| DB | Supabase (local via CLI) | Free realistic Postgres, `db reset` + seed = one-command demo data |
| Data access | Supabase JS client from server only, wrapped by SDK | Avoid exposing DB shape to browser; API is the contract |
| Validation | Zod everywhere | Stated goal; single source of truth |
| Styling | Tailwind + CSS custom properties for Ramp tokens | Tokens as CSS vars = themable, inspectable, honest design-system work |
| Components | Radix primitives skinned to Ramp + hand-built table | Accessibility for free; effort spent on look/feel, not reinventing focus traps |
| Forms | react-hook-form + zodResolver | Contract reuse in the UI layer |
| Component workbench | Storybook 8 in `packages/ui` (a11y addon, static build deployed) | Design system auditable in isolation; per-component definition of done |
| Deploy | Vercel + hosted Supabase (plus full local instructions) | A live link is the strongest first impression there is |

---

## 5. Ramp design system reproduction (design-engineer baseline)

This is a *deliverable*, not styling. Treat it as its own workstream.

**Research phase: DONE — see `docs/design-system.md`.** Headline findings (all from
primary sources — Ramp's shipped CSS/JS):

- Ramp's internal system is **Ryu** (web) / **Mew** (mobile); not public, but its full
  **style-dictionary token sheet ships inside app.ramp.com bundles** — we extracted
  ~290 tokens (colors incl. dark mode, type scale, weights, spacing, table metrics).
- Typeface: **TWK Lausanne 300/350/400** with `"ss01" on`; Ryu's own fallback stack is
  `Lausanne, Inter, Roboto, Arial` → we use **Inter (300/400/700)**, Ramp's own
  declared substitute. Body text is weight **300** — the defining trait.
- Palette: ink `#1A1919`, warm surfaces `#F4F2F0`/`#E9E5E2`, border `#D2CECB`,
  hushed `#6E6A68`, lime accent `#E4F222` (always paired with ink), constructive
  greens, **orange destructive** (`#FF7A36` family — no red anywhere), mustard warning.
- The `@ramp-ds/ui` npm package is **not affiliated with Ramp** — excluded (details in
  design-system doc §4).

**Storybook is part of the deliverable:** Storybook 8 in `packages/ui` (React + Vite
builder, a11y addon). Every component is developed in isolation with stories covering
all states, token-only styling (no hardcoded values), and reference screenshots for
side-by-side comparison. Static Storybook build deployed and linked from README —
reviewers audit the design system in one click.

**Build order in `packages/ui` (each step = component + stories):**

1. `tokens.css` (`--rui-*` custom properties from the extracted sheet) + Tailwind
   preset consuming them + Storybook tokens documentation page
2. Primitives: Button, Input, Select, Badge/StatusPill, Checkbox, Tabs, Tooltip
3. Structural: Sidebar/AppShell, PageHeader, Drawer, Modal, Toast
4. The DataTable (columns, sorting, selection, sticky header, empty/loading states —
   Ryu's real table metrics: 64px rows, 56px selection col, 44px gutter)
5. Domain compositions: ApprovalChain, ActivityTimeline, MoneyText, InvoicePreview

**Opinions to bring (assignment explicitly asks for them)** — seeded in
`docs/design-system.md` §7: weight-300 body vs. WCAG contrast in dense tables;
orange-destructive vs. mustard-warning collision in status-pill-heavy screens;
11-status taxonomy → grouped presentation proposal.

---

## 6. Simulation strategy (make the fakes feel real)

The demo must feel alive without real integrations:

- **OCR:** ship seed invoice PDFs whose extraction fixtures live next to them; uploading
  a "known" invoice returns its fixture after a realistic delay with a "Scanning
  invoice…" state. Unknown uploads land as `missing_info` for manual entry — which
  is itself a real Ramp workflow.
- **Payments:** a payment simulator (route handler or supabase function) advances
  `scheduled → initiated → paid` on a timer or via a discreet "advance clock" dev
  control; one seeded payment fails to demo the failure workflow.
- **Users:** role switcher in the top bar ("Viewing as: Maya — CFO") to walk through
  the approval flow live in one browser session. This is a *demo feature*, framed as such.

---

## 7. Week plan

| Day | Focus | Exit criteria |
|---|---|---|
| **1** | Scaffolding (design research ✅ done — `docs/design-system.md`) | Monorepo builds; supabase migrations + seed run; zod schemas for all models; Storybook boots with tokens page; reference screenshot library assembled |
| **2** | Design system core + app shell | `packages/ui` with tokens, Button/Input/Badge/Tabs/Drawer/AppShell — each with stories; navigable empty app that already *looks like Ramp* |
| **3** | Bills workspace + vendors | DataTable with lifecycle tabs, filters, status pills; bill detail drawer (read-only); vendors list/detail; all against seed data |
| **4** | Create bill + approvals | Upload → fake OCR → confirm form; approval policies + chain; approve/reject with comments; role switcher; activity timeline |
| **5** | Payments + lifecycle | Schedule payment flow, payments view, simulator, failure path; server-side transition guards; dashboard if time permits |
| **6** | Polish + realism | Empty/loading/error states everywhere; seed data storytelling pass; microinteractions; a11y pass; nice-to-haves only if everything above is done |
| **7** | Ship | README (the assignment's exact 5 bullets, in order); design-opinions writeup; Vercel + hosted Supabase deploy; fresh-clone setup test on a clean machine; screenshots/demo GIF; buffer |

**Sequencing rationale:** design system before features (design-engineer track — every
screen built afterward is automatically on-brand, no retrofit); table before forms (it's
the centerpiece and hardest component); README and deploy get a full protected day
because they *are* the first impression.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Design-fidelity rabbit hole (pixel-hunting Ramp) | Timebox research to day 1; tokens + 5 signature patterns > pixel perfection; document intentional deviations as "opinions" (assignment invites this) |
| Monorepo/SDK read as over-engineering | Keep each package tiny and justified in README; no premature abstractions inside them; if it slows us down by day 2, collapse SDK into the app and keep `schemas` + `ui` |
| Table complexity sink | Start from TanStack Table headless; ruthlessly cap features (sort, filter, select — no virtualization, no column DnD) |
| Approval-policy scope creep | Amount-threshold rules only; no arbitrary rule builder |
| Demo breaks on reviewer's machine | Deployed link as primary path; `supabase start && pnpm setup && pnpm dev` tested from a fresh clone on day 7 |
| Supabase local friction (Docker) | Deployed instance is the fallback for reviewers without Docker; say so in README |
| Day 4–5 overrun | Nice-to-haves are pre-cut; the golden path (upload → approve → schedule → paid) is sacred, everything else is negotiable |

---

## 9. Open questions to settle before coding

1. ~~**Auth posture:**~~ **Resolved — seeded users + role switcher (no login).** A fixed
   set of seeded users across Ramp-founded roles (`admin` / `accounts_payable` /
   `employee`) plus an employee seeded onto an approval chain to play the pure
   **approver** (approver is chain membership, not a role — see §4 data model); a UI
   switcher changes who we're "acting as." Reviewers demo the approval loop from every
   seat with zero signup.
   Server access uses the Supabase **secret key** (`@supabase/server` `auth: 'secret'`
   / admin client) with the acting role enforced in app code + zod, not a real JWT
   session — so we skip `@supabase/ssr` cookie/refresh plumbing. RLS policies are still
   authored (defense in depth), exercised via the server role. Authorization logic
   (who may approve/pay) stays real; only the identity mechanism is seeded.

   *Switcher mechanics:* a **foldable drawer** (collapsed by default) lists the seeded
   users/roles. Selecting one writes a **server-readable cookie** (`acting_role` /
   `acting_user_id`) and calls `router.refresh()` so the current route re-renders
   server-side already in that role's context (correct first paint). If the new role
   isn't authorized for the current route, the Server Component **redirects to that
   role's home** and surfaces a **toast** ("Redirected to your home — {role} can't
   access {page}"). Because `redirect()` can't raise a toast directly, the redirect
   carries a short-lived flash marker (cookie or `?notice=`) that the destination
   reads once, renders, and clears.
2. ~~**Permissions model:**~~ **Resolved — unified policy model (role = sum of policies;
   user = role + overrides).** A **policy** is one atomic capability (e.g. `bill.create`).
   A **role** is the sum of a set of policies. A **user** has a role **plus**
   `includedPolicies[]` (additive) and `excludedPolicies[]` (subtractive):
   `effective(user) = (policies(role) ∪ included) \ excluded` — **exclude wins**. This
   encodes both directions: a policy can grant beyond a role *and* remove despite it
   (Ramp's Separation of Duties = the subtractive case). Stored as **data** (seeded
   `role_policies` + per-user override rows, RLS-mirrored, queryable); the policy
   **catalog** is the SSoT in `packages/schemas` (zod enum). Roles are seeded, **not**
   runtime-editable — only *policies* are edited at runtime (see Settings, below).

   *Policy catalog (demo):* `employee.all` (non-AP realm — the employee dashboard),
   `billpay.view`, `bill.create`, `bill.submit`, `bill.edit`, `bill.approve`,
   `bill.pay`, `vendor.view`, `vendor.manage`, `payment.view`, `policy.manage`,
   `user.manage`.

   *Role → policies:*
   - `admin` — all policies (incl. `policy.manage` / `user.manage`).
   - `accounts_payable` — Bill Pay set (view/create/submit/edit/pay, vendors, payments)
     **but not** `bill.approve` (separation of duties) nor the admin levers; plus
     `employee.all`.
   - `employee` — **only** `employee.all`. Blocked from Bill Pay → redirected to the
     employee dashboard. Gains `bill.approve` only when a policy names them (approver).

   *UI:* the role selector shows a **badge** per user; users with overrides read
   **"Customized,"** and hovering lists their `+ included` / `− excluded` policies.

   *Settings tab (admin-only, gated by `policy.manage`):* admin adds/removes approval
   **policies** — this is the demo's "boom" lever (AP creates a bill → employee can't
   approve → admin adds a policy → employee approves). Roles/permission-catalog are not
   editable here; only policies.

   *Employee dashboard (non-AP realm):* a **minimal** "Employee Home" landing page,
   granted by `employee.all`. Doubles as the **redirect target** when an off-Bill-Pay
   employee hits a Bill Pay route, and makes role switches visually obvious.

   *Approval routing (how Ramp does per-bill without manual work — verified against
   support.ramp.com):* admins configure **rules once** (`condition → approver`, e.g.
   `amount ≥ $X → user`); on **bill submit** Ramp auto-evaluates active rules and
   materializes per-bill `approvals` rows. No manual per-bill assignment. Ramp is
   **non-retroactive** (a rule added later does not backfill existing bills), but
   **any user can add an approver to an in-flight bill's chain**. Our model mirrors
   this: policy = rule; evaluation = a `filter`+`sort` at submit; the Approvals tab is
   `bills where an approval row names me AND status = pending`. **See open question 7**
   (now resolved) for how the Settings edit reaches an already-created bill: add an
   `approvals` row to the in-flight chain; phantom approvers auto-approve on a simulated
   delay; the assigned human is the stopper.

3. **Data access:** SDK calls Next.js route handlers (pure API contract story) vs.
   server actions for mutations (less code, more idiomatic App Router)? Recommendation:
   route handlers for reads consumed by the SDK, server actions for form mutations —
   both zod-guarded. Worth a deliberate choice, it's a "how you build it" signal.
4. **LLM-backed OCR** as a stretch: impressive but adds an API-key requirement for
   reviewers. Recommendation: fixture-based fake with the extractor behind an interface;
   mention the swap-in point in README.
5. ~~**Ramp typeface:**~~ **Resolved** — they ship TWK Lausanne (300/350/400, `ss01`);
   we use Inter, which is Ryu's own declared fallback (see `docs/design-system.md` §2.1).
6. **Repo name/product name:** "Ramps" — keep, or brand it lightly (logo lockup in the
   sidebar) as a taste signal?
7. ~~**The "boom" mechanic — how the Settings edit reaches an already-created bill.**~~
   **Resolved — option (a), grounded in the real Ramp UI.** The AP Agent video
   (see [`docs/watch-youtube/ramp-bill-pay-series-ap-agent/findings.md`](watch-youtube/ramp-bill-pay-series-ap-agent/findings.md))
   confirms the approval surface: a `For approval` tab whose table tracks each bill as
   an **N-of-M approval** chain, with a single sequential `Next approver` and a per-row
   `Approve` action. That is exactly the `approvals`-as-chain model in §4.

   The mechanic we build:
   - **Add approver to this bill** — the Settings/bill action writes one `approvals` row
     against the *specific* in-flight bill (Ramp's "add to in-flight chain"). Rules stay
     **non-retroactive**; nothing recomputes globally. Most faithful.
   - **Phantom approvers auto-approve** — bills seed with a chain of `M` approvers. The
     seeded ("phantom") approvers never appear in the role-switcher drawer; on submit
     they auto-approve after a **simulated delay** (same device as the payment
     simulator), advancing the counter `0 of M → (M-1) of M`.
   - **The human is the stopper** — the one approver the demo user *assigns* is the real
     employee. The bill parks at `(M-1) of M` / `Needs your approval` until that human
     clicks `Approve`, at which point it clears to `M of M` and moves to `For payment`.

   Rejected: (b) live rule re-evaluation and (c) rule + backfill — both diverge from
   Ramp's non-retroactive rules and add global-recompute complexity for no demo payoff.

---

## 10. Definition of done (first-impression checklist)

- [ ] Reviewer can click a live URL and see a populated, Ramp-looking product
- [ ] Fresh clone → running locally in ≤ 3 commands
- [ ] Golden path demoable in < 2 minutes: upload invoice → approve as CFO → schedule
      payment → watch it pay
- [ ] README answers the assignment's five bullets in their exact order
- [ ] Design-system doc with token sheet + 2–3 substantiated opinions on Ramp's design
- [ ] Every list screen has real-feeling data, and empty/error states exist anyway
- [ ] No floating-point money anywhere; no illegal state transitions accepted by the API
