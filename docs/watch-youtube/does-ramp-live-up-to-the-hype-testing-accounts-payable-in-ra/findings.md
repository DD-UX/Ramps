# Does Ramp Live Up to the Hype? — Bill Pay UI findings

Source: <https://www.youtube.com/watch?v=JyJ1a65RBf4> (1735s / ~29 min, captured via
the `watch-youtube` skill). Snapshots live in [`snapshots/`](./snapshots); the
narration transcript is [`captions.vtt`](./captions.vtt); chapter map in
[`info.json`](./info.json).

Unlike the AP-Agent walkthrough (Ramp's own marketing), this is a **third-party
accountant's review** — Financial Tech Lab / Clara CFO Group driving a *real*
Clara Media LLC tenant with a *live QuickBooks connection*, uploading *real
messy invoices*. That outsider lens is the value: we see not just the happy path
but the **loading states, the validation, the empty states, and — crucially —
where the AI OCR fails**. A competitor building the same product learns as much
from the failures as the wins.

Everything below is observed from the frames, cross-checked against the
narration — not inferred from docs.

## The lifecycle, re-confirmed from a second angle

Same five-tab shell as the AP-Agent video (`Overview · Drafts · For approval ·
For payment · History`), but here the **Overview groups in-flight bills by
status section** rather than showing a marketing dashboard: `Missing info` →
`Payment details needed` → `Awaiting approvals`, each a labelled group header
with its own rows (frames 18, 11). The status *is* the primary organizing
principle of the list — not a column you sort by, a section you live in. This
validates our lifecycle-tabs + status-grouped-list decision (roadmap #5, #10).

Left nav sitemap (frame 1): `Home · Insights · Manage spend · Expenses · Travel ·
Bill Pay · Financial accounts · Accounting · Vendors · Policy · Company`. Bill
Pay and Vendors are peers; Accounting sits between them (the integration seam).

## Ingest: multi-upload, async, with honest loading states (frames 2–5)

The empty state (frame 2) is a big dashed **dropzone** — "Drop invoices here or
click to upload · Accepts PDF, PNG, or JPG, up to 50 MB per file" — with a
`Try a sample invoice` escape hatch and three alternative entry points below:
**Forward invoices to `…@ap.ramp.com`** (email-in), **Create via spreadsheet**
(CSV), **Create without an invoice** (manual). We build the drag-drop path real;
the other three are roadmap lines (email/CSV = cut/nice-to-have per roadmap #3/#4).

What a competitor should copy, in order:

1. **Batch upload** — she drops **three invoices at once**; a toast reads
   `Uploading 3 invoices` (frame 3). Bills are created in bulk, not one-by-one.
2. **Async processing with a skeleton row** — the new bill appears in the list
   immediately as `Processing 1 document` with a **shimmering skeleton row**
   (frame 4) while OCR runs in the background. The user is never blocked. This is
   a design detail worth reproducing: optimistic row → skeleton → hydrated.
3. **AI-generated description** — Ramp writes a plain-English `Description`
   ("Consulting services for November website work") the invoice never literally
   stated (frame 6). It's a summarization, not an extraction.

## Draft review: validation-first, side-by-side invoice (frame 6)

The draft-review screen is the workhorse. Layout: a left **worklist rail**
(`Missing info` / `Ready for review` / `Awaiting approvals` groups with
prev/next `J`/`K` keyboard nav), the editable form in the middle, and the
**invoice rendered in a right-hand pane**, side by side, with zoom controls.

The validation model is the standout:

- **Blocking red banner** — "Add missing information for {vendor} · This vendor
  is missing a state and a vendor contact" with the offending fields
  (`State (required)`, `Contact email (required)`) highlighted red inline
  (frame 6). Ramp explains *why*: "Due to regulatory requirements, Ramp needs to
  know where this vendor is located in order to pay this bill." The bill **cannot
  advance** until resolved — the worklist even sorts it into a `Missing info`
  bucket.
- **Section-level completeness pills** — each form section carries a status pill:
  `Vendor: Incomplete`, `Bill details: Complete`, `Line items: Incomplete/Complete`
  (frames 6, 7). A per-section green/amber checklist, not one global valid flag.

→ For us: this is the ground truth for our zod-resolver form. **Field-level
required + section-completeness + a lifecycle bucket keyed off validation state.**
The "why" microcopy on regulatory fields is a nice trust touch to reproduce.

## Line-item coding against a live QuickBooks connection (frames 7, 8)

This is the same coding grid as the AP-Agent frame-9, but here it's wired to a
**real accounting integration**, so the dimension dropdowns are labelled with the
provider's name: **`QuickBooks Category`** and **`QuickBooks Customer`** per line
(frame 7), plus a `Billable?` toggle. This is exactly the integration seam our
model reserves `external_id` + `source` for — the dropdown options are synced
records, not free text.

- Each line expands into its coding row (`↳ QuickBooks Category · QuickBooks
  Customer · Billable?`).
- **Expense vs. item / inventory** — the yarn vendor (frame 8) codes lines to an
  **`Inventory Asset` account** (`1400 - Inventory Asset`), with a `Vendor default`
  option in the dropdown. This is Ramp's `expense | item` discriminator in the
  wild: inventory purchases hit an asset account, not an expense GL. Confirms our
  per-line `kind` discriminator (roadmap #8).
- **`Save as default coding for future bills`** checkbox (frame 9 of the other
  video; visible here at the top of frame 9's payment view) — per-vendor default
  coding, reused on the next bill. Maps to vendor-level default coding.
- **`Collapse line items`** — a many-line invoice can be collapsed to a single
  summary line (frames on the Ziply/Culver bills). The inverse of the AP-Agent's
  "simplify into a single line item." We keep both the expanded grid and a
  collapsed summary view.

## Payment: inline on the draft, then a confirm modal (frames 9, 13)

Payment is configured **inline on the draft** (`Payment details` section,
frame 9): `Payment method: ACH (Direct deposit)`, `Pay from account: Thread Bank
(…4029)`, `Send payment to`, and a **`Schedule now` / `Schedule later`** toggle
with `Payment date` + computed `Arrival date` ("2 business days") + an
**overdue banner** ("This bill is 37 days overdue · Get it approved by 1:00 PM
for same-day delivery · `Add same-day delivery`"). Time-sensitive upsell wired
into the schedule.

When paying from the list, a compact **"When do you want to pay this bill?"
modal** confirms: payment date picker + "Estimated arrival on {date}" +
`Pay on {date}` CTA (frame 13). Two-surface pattern: configure inline, confirm
in a modal.

Payment rails named in narration + method picker: **ACH, wire, check** (and the
"Ramp business account" from the other video). We simulate the send + status
progression (roadmap #13).

## Approvals: the CTA-swap is the lifecycle proof (frames 10–12)

- **Add approver on the draft** (frame 10) — the `Approvals` section lists an
  ordered approver row (`1 · Hannah Smolinski · Any Admin`) with a **`+ Add
  approver`** button. This is the exact mechanic behind our open-question 7: an
  approver is a row you can add to an in-flight bill.
- **N-of-M counter in the table** (frame 11) — the `For approval` list shows a
  `0 of 1 approval` status pill per row, a per-row `Approve` button, bulk-select
  checkboxes, and a Status filter.
- **The state transition** (frame 12) — after approving, the **same row flips to
  `1 of 1 approval` (green check) and the action button changes `Approve` →
  `Pay now`.** This single frame-pair is the cleanest proof of the lifecycle:
  approval both increments the counter *and* advances the bill to the payable
  state, swapping the primary action. Our `transitionBill()` guard should mirror
  this — approve is what unlocks pay.

## Vendors are first-class, with a "request from vendor" flow (frames 14–16)

- **Vendor detail** (frame 16) — `Overview · Payment & tax · Insights` tabs;
  `Payment details` + `Tax details` (Consent for digital delivery, **1099 status
  2025/2026**). Vendors carry payment config *and* tax/compliance state.
- **Payment & tax drawer** (frame 14) — Card acceptance preference, payment-doc
  dropzone, `Add payment method`, tax-doc (W-9) dropzone, and a `Request
  information` button.
- **"Send a request" modal** (frame 15) — the flow a competitor should steal:
  request missing details *from the vendor by email*, **multiple at once** via
  checkboxes: `ACH (Direct deposit) details` (+ `Require bank account
  confirmation`), `Check by mail details`, `Domestic wire details`, `Tax details
  (W-8 or W-9 document — required)`, plus an optional message and attachment
  picker → `Send request`. This closes the "missing vendor info" loop the red
  banner opens: the app doesn't just flag the gap, it lets you *chase* it.
- **Create new vendor inline** (frame 5) — when OCR matches an unknown payee, the
  draft offers `Select another vendor` / **`Create new vendor`** right there.
- **Ramp Vendor Network** — a second browser tab (frames 11, 18) hints at a
  shared vendor directory; out of scope for us, noted for awareness.

## Where Ramp *fails* — the honest limits (frames 19, 20)

The reviewer's most useful contribution: she deliberately feeds Ramp hard inputs
and documents the breakage. A competitor's differentiation lives here.

1. **Multi-invoice-in-one-PDF** (frames 19, 4-page Home Depot Pro doc) — a single
   PDF containing *several distinct invoices* is ingested as **one bill**. OCR
   extracts only a `Total` + `Previous balance` line and leaves `Line items:
   Incomplete`; the AI-written description even admits "Multiple invoices for
   plumbing supplies, water heaters, and management fees." Ramp does **not** split
   one PDF into N bills.
2. **Dense/complex line tables** (frame 20, Culver Rug Co carpet invoice) — a
   busy invoice with many line items + a handwritten-annotated scan extracts only
   `Total $3.89` + `Previous balance $1,293.66`; the real line detail is dropped
   (`Line items: Incomplete`). OCR degrades on visual density and handwriting.

**What this hands us:** our simulated OCR should model *both* outcomes honestly —
clean invoices → fully-coded draft; unknown/degenerate uploads → a draft with
`Line items: Incomplete` and a `missing_info` lifecycle bucket (roadmap #1). The
failure state is not an error to hide; it's a first-class UI state Ramp itself
ships. Reproducing the skeleton-row → partial-extract → "needs your input" arc is
more faithful than pretending OCR is perfect.

## What we take into the build

1. **Status-grouped bill list** (Missing info / Payment details needed / Awaiting
   approvals) as the Overview, not just sortable tabs.
2. **Async ingest UX**: batch upload → toast → optimistic skeleton row →
   hydrated draft. Model the *partial-extract* failure state explicitly.
3. **Validation-first draft**: field-level required + section-completeness pills +
   the regulatory "why" microcopy; blocking banner routes the bill to `Missing
   info`.
4. **Line coding = provider-labelled dropdowns** (`QuickBooks Category/Customer`),
   `Inventory Asset` for `item` lines, `Save as default coding`, collapse toggle —
   all grounded in `external_id`/`source` seam.
5. **Approve → CTA flips to Pay now** as the visible lifecycle transition; N-of-M
   counter + `Add approver` for the chain (open-q 7).
6. **Vendor "Send a request"** multi-select email flow to close the missing-info
   loop; vendor 1099/tax state as first-class fields.
7. **Two payment surfaces**: inline schedule on the draft + a compact
   "when to pay" confirm modal; overdue banner + same-day upsell.
