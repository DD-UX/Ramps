# Ramp Bill Pay — video research corpus

Ground-truth UI/UX for the payables build, captured frame-by-frame with the
[`watch-youtube`](../../.claude/skills/watch-youtube/) skill. Each subfolder holds
`findings.md` (annotated notes distinguishing what was **seen** in frames vs.
**narrated**), the curated `snapshots/`, `captions.vtt`, and `info.json`.

This README is the **synthesis layer**: the cross-video knowledge rollup so the
build can be driven from one map instead of ten separate reports.

> **Confidentiality.** These docs describe only Ramp's own public product and
> generic AP/accounting concepts. Named integrations (QuickBooks, Sage Intacct,
> Xero, NetSuite) are Ramp's own — shown on screen. No third-party/client
> codebase is referenced.

## The corpus

Two sources: the official **Ramp Bill Pay playlist**
([PLfEbMx3FLWDa73XnP1bz11_bCTKY6gXKE](https://www.youtube.com/playlist?list=PLfEbMx3FLWDa73XnP1bz11_bCTKY6gXKE))
and one third-party accountant review. One playlist entry was unavailable.

| # | Video | Lens | Folder |
|---|-------|------|--------|
| 1 | Ramp Bill Pay **Product Overview** | Ramp marketing — full lifecycle | [`ramp-bill-pay-product-overview`](./ramp-bill-pay-product-overview/findings.md) |
| 2 | Bill Pay Series: **AP Agent** | Ramp marketing — AI agent + coding grid | [`ramp-bill-pay-series-ap-agent`](./ramp-bill-pay-series-ap-agent/findings.md) |
| 3 | Bill Pay Series: **1099's** | Ramp — vendor tax reporting | [`ramp-bill-pay-series-1099-s`](./ramp-bill-pay-series-1099-s/findings.md) |
| 4 | Accounting Series: **Universal CSV Export** | Ramp — export to ERP | [`ramp-accounting-series-bill-pay-ucsv-export`](./ramp-accounting-series-bill-pay-ucsv-export/findings.md) |
| 5 | Import Bills — **NetSuite** | Ramp — integration seam | [`ramp-bill-pay-series-import-bills-netsuite`](./ramp-bill-pay-series-import-bills-netsuite/findings.md) |
| 6 | Import Bills — **QuickBooks Online** | Ramp — integration seam | [`ramp-bill-pay-series-import-bills-quick-books-online`](./ramp-bill-pay-series-import-bills-quick-books-online/findings.md) |
| 7 | Importing Bills — **Sage Intacct** | Ramp — integration seam | [`ramp-bill-pay-series-importing-bills-sage-intacct`](./ramp-bill-pay-series-importing-bills-sage-intacct/findings.md) |
| 8 | Import Bills — **Xero** | Ramp — integration seam | [`ramp-bill-pay-series-import-bills-xero`](./ramp-bill-pay-series-import-bills-xero/findings.md) |
| 9 | Introducing **1099 Filing** (teaser) | Ramp — e-file promo | [`introducing-1099-filing-in-ramp-bill-pay`](./introducing-1099-filing-in-ramp-bill-pay/findings.md) |
| 10 | **Does Ramp Live Up to the Hype?** | Third-party review — real messy invoices | [`does-ramp-live-up-to-the-hype-testing-accounts-payable-in-ra`](./does-ramp-live-up-to-the-hype-testing-accounts-payable-in-ra/findings.md) |

## Cross-video synthesis

### 1. The bill lifecycle is the product spine

Every video confirms the same **five-tab shell**: `Overview · Drafts · For
approval · For payment · History`, with a `New bill` primary (yellow) button and
`Recurring bills` secondary. The **Overview groups in-flight bills by status
section** (`Missing info` → `Payment details needed` → `Awaiting approvals`)
rather than being a sortable-only table (video 10). Status is a *place you live*,
not just a column.

The visible lifecycle transition proof: **approve flips the row `0 of 1 → 1 of 1`
and swaps the row CTA `Approve → Pay now`** (video 10). Our `transitionBill()`
guard should mirror this — approval is what unlocks pay.

→ Build: lifecycle tabs + status-grouped list (roadmap #5, #10); server-guarded
transitions (Phase 5).

### 2. Ingest is multi-channel, async, and honest about failure

Entry points (video 1 `New bill` menu): **email-forward** to a per-entity
`@ap.ramp.com` address (Recommended), **drag-drop** (full-screen dropzone, batch
upload), **spreadsheet/CSV**, **create-without-invoice** (manual), and **import
from the accounting provider** (videos 5–8). The dropzone accepts PDF/PNG/JPG up
to 50 MB (video 10).

Async UX (video 10): batch upload → `Uploading N invoices` toast → optimistic
**skeleton row** (`Processing 1 document`) → hydrated draft. Never blocks.

**OCR failure is a first-class state, not an error to hide** (video 10): a
multi-invoice-in-one-PDF or a dense/handwritten invoice extracts only
`Total + Previous balance` and leaves `Line items: Incomplete`; an AI-*generated*
description summarizes the doc. Our simulated OCR must model both outcomes:
clean → coded draft; degenerate → `missing_info` bucket + `Incomplete` lines.

→ Build: one real drag-drop path; email/CSV as roadmap lines; model the
partial-extract state explicitly (roadmap #1, #4, #7).

### 3. Coding is line-level, against provider-labelled dimensions

The single most important data-model frame recurs across videos 1, 2, 5, 10: each
line expands into a coding grid of **"{Provider} X" dropdowns** — the label tracks
the connected system: `NetSuite Category/Location/Department/Classification`
(video 1), `QuickBooks Category/Customer` (video 10), plus `Billable?`. Inventory
lines code to an **`Inventory Asset` account** — Ramp's `expense | item`
discriminator in the wild (video 10). A **`Save as default coding for future
bills`** checkbox persists per-vendor defaults, and **`Collapse line items`**
simplifies many lines into one.

The dropdown *options are synced records*, not free text — the exact seam our
model reserves `external_id` + `source` for.

→ Build: one `bill_line_items` table, per-line dimensions FK'd to seeded
reference tables (`gl_accounts`, `departments`, `classes`, `locations`,
`tax_codes`), each carrying nullable `external_id` + `source`
(`quickbooks|sage|xero|netsuite|seed`); `kind: expense|item`; split =
`split_group_id` sibling rows. (See ANALYSIS.md §4; roadmap #2, #2b, #8.)

### 4. The accounting integration is a bidirectional seam (videos 5–8, unanimous)

All four import videos show an **identical pattern** across NetSuite / QuickBooks /
Sage Intacct / Xero — strong evidence this is *the* shape to reproduce:

- **One toggle** under `Bill Pay settings → Importing` enables continuous sync
  (`Import bills from {provider}`). No per-field mapping UI shown → convention +
  pre-built templates.
- **Account mapping**: a Ramp bank account is mapped to the provider's cash/GL
  account for reconciliation.
- **Provenance on every imported bill**: an `Imported · {date}` label, a
  `last updated {timestamp}` banner with manual `Refresh`, and an **`Open in
  {provider}`** deep link. The provider's bill number becomes the Ramp invoice #.
- **Imported bills skip approval** — they land in `For payment` (already approved
  upstream), not `For approval`. Implies a `source`-driven routing / approval-
  bypass flag.
- **Bidirectional**: bills flow provider → Ramp for payment; payment status +
  date flow Ramp → provider after execution (bill marked `PAID` upstream).
- Core fields (vendor, amount, invoice #, dates) are **read-only** on imported
  bills; only Ramp payment metadata is editable — source system stays truth.

→ Build: this *validates and sharpens* our seam. Columns/tables to carry:
`bills.external_id`, `bills.source`, `bills.imported_at`, `bills.last_synced_at`,
a `source`-driven approval-bypass path, and a stored provider instance URL for
deep-link construction. We simulate the sync (no live rails) but keep the shape
honest.

### 5. Payments: two surfaces, batched by vendor, method-flexible

Configure payment **inline on the draft** (`Payment details`: method, pay-from
account, `Schedule now/later`, computed arrival "2 business days", overdue banner
+ same-day upsell — videos 1, 10), then confirm in a compact **"When do you want
to pay this bill?"** modal (video 10). Methods: **ACH · wire (domestic/intl) ·
check · Ramp card** (cashback upsell when the vendor accepts cards — videos 1, 5,
6, 7, 8). Bulk release **batches bills by vendor** into one payment while
preserving individual invoice references, with a `Batched` badge and a grouped
review modal (videos 1, 5).

→ Build: inline schedule + confirm modal; method picker; `payments` 1:N `bills`
(batch); simulated `scheduled → initiated → paid` + one seeded failure
(roadmap #13).

### 6. Approvals: N-of-M, sequential, with advisory AI

`For approval` table: per-row `N of M approvals` counter, `Needs your approval`
next-approver, per-row `Approve` + bulk select (videos 1, 2, 10). On the draft, an
ordered `Approvals` list with **`+ Add approver`** (videos 1, 10) — the mechanic
behind open-question 7. AI **suggested action** is advisory, not gating: amber
`Review recommended` (lists flags: "payment method changed CARD→ACH", "invoice #
has too many digits") vs. green `Ready to approve` (checks-passed list) — videos
1, 2. A human still clicks approve.

→ Build: N-of-M chain, sequential next-approver, `Add approver` writes an
`approvals` row to an in-flight bill; phantom approvers auto-approve on a
simulated delay, one real human stopper. Two `SuggestedAction` banner states as
seeded copy (roadmap #12; ANALYSIS.md open-q 7).

### 7. Vendors are first-class, with a "chase the vendor" loop

Vendor detail (`Overview · Payment & tax · Insights`) carries payment config +
tax/compliance state (**1099 status per year**, W-9, consent for digital
delivery) — videos 3, 10. The **"Send a request"** modal emails the vendor for
missing details, **multiple at once** via checkboxes (`ACH details / Check by
mail / Domestic wire / Tax details W-8/W-9 required`) — video 10. Unknown payees
resolve via `Select another vendor` / **`Create new vendor`** inline during a
draft (videos 1, 10).

→ Build: vendors carry payment details + default coding + tax state; a
request-info flow closes the `missing_info` loop the validation banner opens
(roadmap #14).

### 8. 1099 tax reporting (videos 3, 9) — nice-to-have, but well-specified

A dedicated **1099 dashboard** off the Vendors tab (`Review 1099 vendors`) with
tabs `Overview · Needs review · Ready to file · Completed · Excluded vendors`.
Vendors auto-populate when spend crosses the IRS $600 threshold; status drives
the workflow (`Missing tax details` → `Ready to file`). Features: bulk W-9
request, **AI box-mappings** (GL category → 1099 box, e.g. `Rent → 1099-MISC Box
1`) overridable per line, TIN masking + "verified by Ramp" badge, e-consent
tracking, and a **4-step filing wizard** (overview/deadline → payer info →
delivery method digital-vs-mail → purchase summary with per-form fees) that
e-files to IRS + state.

→ Build: **out of golden-path scope** (roadmap ⚪/🔵). Value captured here: 1099
status is a first-class vendor field; box-mapping is GL-category-driven. Reproduce
the *vendor tax fields*; document filing as a roadmap line.

### 9. CSV / Universal-CSV export (video 4)

`Export` from the Bill Pay table header → `Review & export` modal previews three
files (**Bills · Payments · Vendors**), each a separate CSV with its own schema.
`Customize exports` lets a user upload their ERP's CSV format so Ramp maps future
exports to match (the "universal CSV" idea). Rich columns: bill/vendor IDs,
invoice #, status, dates, payment type, GL category, amount, deep links.

→ Build: **nice-to-have** (roadmap #19). If built: export bills + payments +
vendors as separate CSVs; a saved column template.

## Where this feeds

- **Design system**: [`../design-system.md` §8](../design-system.md) links this corpus
  as the product-surface evidence behind token reproduction.
- **Data model**: [`../ANALYSIS.md` §4](../ANALYSIS.md) — the line-item + dimension
  + `external_id`/`source` tables the import videos validate.
- **Scope**: [`../roadmap.md` §1](../roadmap.md) — every capability above maps to an
  explicit In / Simulated / Nice-to-have / Cut decision.
