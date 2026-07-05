# Ramp Bill Pay Series: AP Agent — UI findings

Source: <https://www.youtube.com/watch?v=ayjnY1g6XLo> (163s, captured via the
`watch-youtube` skill). Snapshots live in [`snapshots/`](./snapshots); the
narration transcript is [`captions.vtt`](./captions.vtt).

This is a marketing walkthrough of Ramp's **AP Agent**, but the value for us is
the ground-truth **Bill Pay UI**: the tab structure, the approval-chain
mechanic, the payment-method drawer, and the two AI "suggested action" states.
Everything below is observed from the frames — not inferred from docs.

## The five-tab Bill Pay shell

`Overview · Drafts · For approval · For payment · History` — a single top-level
`Bill Pay` page with a tab bar, a `New bill` primary (yellow) button, and a
`Recurring bills` secondary. Left nav groups Bill Pay under spend management.

This maps directly to our bill lifecycle: `draft → for approval → for payment →
paid (history)`. We reproduce the tab bar as the primary navigation for bills.

## Approval chain: N-of-M, sequential (frame 6 — the key one)

The **For approval** table is the single most important frame. Columns:

| Column             | Observed values                                           |
| ------------------ | --------------------------------------------------------- |
| Vendor / submitter | Figma / Salesforce / Slack / UPS / … · submitter + date   |
| Suggested action   | `Review recommended` (amber) · `Ready to approve` (green) |
| Status             | `0 of 2 approvals`, `0 of 1 approval`, `0 of 3 approvals` |
| Next approver      | `Needs your approval`                                     |
| Amount             | e.g. `$150,042.75`                                        |
| Actions            | per-row `Approve` button + overflow                       |

Confirmed mechanics:

- **N of M approvals** — each bill carries an approval _chain_ of M approvers;
  the counter tracks how many have signed. A bill clears only when `M of M`.
- **Sequential** — one `Next approver` at a time (`Needs your approval`), not a
  free-for-all. Approvers are surfaced in order.
- **Suggested action is advisory, not gating** — the AI's `Review recommended` /
  `Ready to approve` label is a hint; a human still clicks `Approve`.

### How this grounds our demo (open-question 7)

The user's find: the real Ramp UI lets you **add an approver** to an in-flight
bill. We simulate the chain with **phantom approver users** — seeded approvers
that never appear in the role-switcher drawer. On submit they auto-approve after
a **simulated delay** (same trick as the payment simulator). The one _real_
stopper is the custom employee the demo user assigns: the bill parks at
`(M-1) of M` until that human approves. See ANALYSIS.md §9 open-question 7.

## Two AI states on the bill detail

- **`Review recommended`** (frame 7, Staples) — amber. The card lists what the
  agent checked and what it flagged ("Bill totals $15.4K, ~5× recent $3.01K
  bills"). Vendor **hovercard** on hover (logo, blurb, approver + department).
  Invoice renders in a right-hand panel, side by side with the summary.
- **`Ready to approve`** (frame 8, W.B. Mason) — **green** card with a soft
  glow. "Checks passed:" list (coding consistent, memo clear, amount in range,
  categories present, payment on time, method matches). Same split invoice pane.

We reproduce these as two `SuggestedAction` states on the bill drawer — a hint
banner over the invoice viewer. The checklist is seeded copy, not live AI.

## Bill creation + payment (frames 1–5)

- **Frame 1** — Overview: draft dashboard with an agent **fraud flag** callout
  ("60+ signals to flag suspicious fraud"), surfaced on the draft bill.
- **Frame 2** — Create bill: vendor picker + bill-details form (OCR-prefilled).
- **Frame 3** — Line-item **coding**: GL-account dropdowns per line (the "AP
  agent codes each line item"). See the sharper close-up in frame 9 below.
- **Frame 4** — Payment method drawer, **Ramp Card**: `Pay automatically` /
  `Send to vendor` / `Use myself`. Card path is a cash-back upsell.
- **Frame 5** — ACH payment: bank details + **schedule** (pay-on date). Payment
  rails offered: `ACH · wire · check · Ramp business account`.

## Line-item accounting dimensions (frame 9, t=46 — the coding grid)

The single clearest frame for the data model. The draft bill's **Line items**
panel: each line (`01 Office Chairs · $12,000`) expands into a coding grid of
**"Accounting X" dropdowns** — the fields normally absorbed from the accounting
integration:

| Ramp field (frame 9)  | Our column (§4) |
| --------------------- | --------------- |
| Accounting Category   | `gl_account_id` |
| Accounting Department | `department_id` |
| Accounting Class      | `class_id`      |
| Accounting Location   | `location_id`   |
| Accounting Tax Code   | `tax_code_id`   |
| Accounting Billable   | `billable`      |

Also on the frame: `⚡ Ramp can simplify these into a single line item`,
`Collapse line items`, and a **"Save as default coding for future bills"**
checkbox (default/pre-set coding, reused on future bills). Right pane shows the
invoice with a matching line table (Office Chairs / Standing Desks / Monitors …).

**Two decisions this frame + Ramp's docs settled** (docs:
["Bill Pay accounting"](https://support.ramp.com/hc/en-us/articles/4418336469011-Bill-Pay-accounting),
["Line Item Splits"](https://support.ramp.com/hc/en-us/articles/44736835918867-Bill-Pay-Line-Item-Splits-and-Allocation-Templates),
["Expense vs. item"](https://support.ramp.com/hc/en-us/articles/10859570893203-Invoice-line-items-Expense-vs-item)):

1. **Coding is line-level.** Every dimension is per-line; one bill mixes codings.
2. **No separate GL-distribution table.** Some AP systems split _invoice line_
   from _GL distribution_ (a journal-entry table); **Ramp does not.** A split
   _replaces_ a line with N lines, each with its own amount + coding. So we keep
   **one** `bill_line_items` table (split = sibling rows), not item+entry. Ramp's
   only line _type_ split is `expense` vs `item` — a per-row discriminator.

### Note on the accounting-integration seam

These "Accounting X" values are the dimensions a real deployment would sync from
an accounting provider (QuickBooks / Sage / Xero / NetSuite). The standard shape
is a local reference record holding the provider's native ID + a display name +
active status. We reproduce that shape as seeded tables with nullable
`external_id` + `source` provenance columns — no live sync, just a clean seam.
See ANALYSIS.md §4 for the table definitions.

## What we take into the build

1. Five-tab Bill Pay shell as primary bill navigation.
2. `For approval` table with the exact columns above — N-of-M counter is the
   spine of our approvals model.
3. Two `SuggestedAction` banner states (amber review / green ready) over a
   side-by-side invoice viewer.
4. Payment-method drawer with method + schedule; simulate the send.
5. Phantom-approver seeding to make the chain feel real with one human stopper.
