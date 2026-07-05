# Ramp Bill Pay: Importing Bills from Sage Intacct

**Video:** [Ramp Bill Pay Series: Importing Bills - Sage Intacct](https://www.youtube.com/watch?v=SJlywakfK1I)
**Duration:** 1:48 (108 seconds)
**Date Analyzed:** 2026-07-03
**Snapshots:** [./snapshots](./snapshots)

---

## Overview

This video demonstrates Ramp's bill import integration with Sage Intacct, showing how bills created and approved in the accounting system automatically sync into Ramp for payment. The integration maintains a bidirectional sync: bills flow from Sage Intacct into Ramp, and payment status updates flow back to Sage Intacct after execution.

**Key Value Proposition:** Companies can continue creating bills in their existing accounting system workflow while unlocking Ramp's payment flexibility (ACH, wire, check, card) and optimizations (batch payments, cashback opportunities, automated scheduling).

---

## 1. Source System: Sage Intacct Open Bills (0:16-0:20)

**Frame:** `01-sage-intacct-open-bills.jpeg` (timestamp: ~10s)

**What We See:**

- Sage Intacct UI showing "Results for: AP bill" search with 5 open bills
- Table columns: Bill number, Vendor name, Total amount, Description, Date, Summary
- All bills are to "Amazon Business" vendor
- Bill numbers: ABZ1, ABZ2, ABZ3, ABZ4, ABZ5
- Amounts ranging from $5,703.42 to $27,284.92
- Summary column shows: "Bills (USD): 2025/02/02 19:02:18:8237 Batch"
- These are the source records that will be imported into Ramp

**What Narrator Says:**

> "Here we are looking at our open bills in Sage. These are bills that have already been created and approved in ramp under Bill Pay."

**Note:** The narration appears to misspeak — these bills were created in Sage Intacct, not "created and approved in ramp." The integration pulls bills FROM Sage Intacct INTO Ramp.

**Key Insight for Our Build:**

- Bills exist as records in the accounting system FIRST
- Each bill has a unique identifier in the source system (bill number like "ABZ4")
- This validates our `external_id` / `source` / `provider_record_id` provenance model
- We need to preserve the accounting system's bill number as the external reference

---

## 2. Ramp Bill Pay Settings: Payments Tab (0:23)

**Frame:** `02-ramp-bill-pay-settings-payments-tab.jpeg` (timestamp: ~23s)

**What We See:**

- Ramp "Bill Pay settings" modal with tabs: Payments, Permissions, Approvals, Accounting, Importing
- "Payments" tab selected showing "Enabled accounts" section
- Bank account configuration:
  - "Manual Accounts" section with 1 account enabled
  - "Checking (•••• 9752)" account enabled with toggle ON
  - Labeled as "Autopay source · Savings Account · $4,779,707.46"
  - Dropdown: "Select Sage Intacct cash account (required)"
  - Help text: "Link your chosen account to the correct cash account on Sage Intacct."
- Links at bottom: "Manage bank accounts" and "Manage accounting settings"

**What Narrator Says:**

> "Under Bill Pay settings we can go ahead and enable Bill importing..."

**Key Insight for Our Build:**

- Before enabling bill import, payment accounts must be configured
- The integration requires MAPPING a Ramp bank account to a Sage Intacct cash account
- This is the account-to-account reconciliation bridge
- Our system would need similar mapping: which internal payment account corresponds to which GL cash account in the ERP

---

## 3. Ramp Bill Pay Settings: Account Mapping Detail (0:23)

**Frame:** `03-bill-pay-settings-payments-accounts.jpeg` (timestamp: ~23s — same frame, duplicate of #2)

This frame is identical to the previous one showing the Payments tab account mapping interface. The key takeaway is the required mapping between Ramp's payment account and Sage Intacct's cash account for reconciliation.

---

## 4. Importing Tab: Sage Intacct Bill Import Toggle (0:26-0:29)

**Frame:** `04-importing-tab-sage-intacct-toggle.jpeg` (timestamp: ~27s)

**What We See:**

- "Bill Pay settings" modal, "Importing" tab selected
- Section header: "Pay bills from Sage Intacct on Ramp"
- Toggle switch: "Import bills from Sage Intacct" (enabled/green)
- Success toast notification: "Ramp will now import bills from Sage Intacct"
- Link: "Learn more about importing bills"
- Below: "Overbilling protection" section (Plus feature badge)
  - "Flag unexpectedly high invoices" option (enabled with blue highlight)
  - Description: "Ramp Intelligence will automatically flag unexpectedly high line items to your team"
  - "Block payments for unexpectedly high invoices" toggle (disabled)

**What Narrator Says:**

> "Once enabled these bills sync automatically into ramp no manual uploads or extra steps needed."

**Key Insight for Our Build:**

- The import is a simple ON/OFF toggle once the integration is connected
- After enabling, the sync happens automatically (no batch upload UI)
- Additional intelligence layer: overbilling protection flags anomalies
- This validates our approach: once source is configured, sync is automatic
- The system pulls bills that are in "open" or "awaiting payment" status in the ERP

---

## 5. Ramp Bills: "For Payment" Tab with Imported Bills (0:34-0:39)

**Frame:** `05-ramp-for-payment-imported-bills.jpeg` (timestamp: ~40s)

**What We See:**

- Ramp Bills list view, "For payment" tab selected
- Status filter showing: "Ready for release", "Scheduled", "Initiated", "+7"
- Vendor filter: "Amazon Business"
- Timestamp in top right: "Imported bills last updated Feb 12, 11:40 AM" with "Refresh" button
- Four bills displayed, all labeled "Imported · Feb 3, 2025" (or Feb 2 for last one)
- All bills show "Unscheduled" status (red pill badge)
- All bills to "Amazon Business" vendor with avatar "AB"
- Amounts: $27,284.92, $5,703.42, $26,259.45, $24,097.99
- Due date column: "Mar 4, 2025" for all
- "Invo" column shows "Feb" (presumably invoice date)
- "Pay now" action button for each bill
- Bottom shows: "1–4 of 4 matching bills · $83,345.78 total"

**What Narrator Says:**

> "Imported bills land in the for payment tab ready to be scheduled and as new bills are created will automatically bring them in too so nothing gets missed."

**Key Insight for Our Build:**

- Imported bills have a distinct label: "Imported · [date]"
- This is the "source" provenance we need to track
- The sync timestamp is displayed: "last updated Feb 12, 11:40 AM"
- Bills arrive in an "Unscheduled" state, ready for payment scheduling
- All the core bill data is synced: vendor, amount, due date, invoice number
- The UI clearly distinguishes imported bills from manually created ones

---

## 6. Imported Bill Detail: "Open in Sage Intacct" Deep Link (0:51-0:55)

**Frame:** `06-imported-bill-open-in-sage-intacct.jpeg` (timestamp: ~53s)

**What We See:**

- "Set up for payment" modal for bill ABZ4
- Header badge: "Imported on 2/3/25 · Open in Sage Intacct" (with link icon)
- "Imported bill details" section showing:
  - Vendor: "Amazon Business" (AB avatar), email: adp@ramp.com
  - Invoice number: ABZ4
  - Invoice date: 2/2/2025
  - Due date: 3/4/2025
  - Bill total: $27,284.92
- Below: "How do you want to pay $27,284.92?" with cashback banner
- Left side shows invoice upload dropzone

**What Narrator Says:**

> "You can also easily navigate to your accounting system to reference the original bill."

**Key Insight for Our Build:**

- CRITICAL: "Open in Sage Intacct" link is a deep link back to the source record
- This requires storing the provider's record URL or constructing it from the external_id
- The import date is displayed: "Imported on 2/3/25"
- This validates our `external_id` / `source` / `provider_record_id` fields
- The invoice number (ABZ4) matches the Sage Intacct bill number exactly
- Users can jump back to the source system to see full accounting detail/line items
- The link pattern likely follows: `https://www-p504.intacct.com/ia/acct/editor.phtml?readmes=...&bill_number=ABZ4` (visible in earlier Sage frame)

---

## 7. Payment Method Selection: Cashback Opportunity Highlighted (0:57-1:05)

**Frame:** `07-payment-methods-cashback-opportunity.jpeg` (timestamp: ~60s)

**What We See:**

- Payment method dropdown expanded showing options:
  - **ACH (Direct deposit)** — "Pay directly from your bank account" (checkmark selected)
  - **Domestic wire** — "Pay US-based bank accounts" (yellow "New" badge)
  - **Check by mail** — "Ramp will debit your bank and mail a check to your vendor's address"
  - **Pay with Ramp Card** — "Use an existing card or create a new, single-use card just for this bill" (yellow "1% cashback" badge)
  - **I won't pay this with Ramp** — "Create, track, and approve this bill with Ramp but make the payment manually"
- Above payment methods: Blue banner promoting card payment
  - "Get $272.85 cashback when you pay by card"
  - "Amazon Business accepts card payments. Pay with a Ramp Card and earn $272.85."
  - Buttons: "Switch to card" and "Request live demo"

**What Narrator Says:**

> "With ramp you have multiple ways to pay a check wire or card. Ramp even Flags opportunities to pay by card helping you maximize cash back whenever possible."

**Key Insight for Our Build:**

- Imported bills flow into the SAME payment scheduling flow as manual bills
- Payment method flexibility is a core value prop
- Intelligent suggestions: the system knows vendor accepts cards and calculates cashback
- This is NOT specific to Sage Intacct integration — it's Ramp's payment layer
- For our build: focus on getting bill data (vendor, amount, due date, invoice#) synced correctly
- The payment execution is a separate concern from the import/sync

---

## 8. Batch Payment Review: Multiple Bills to Same Vendor (1:13-1:22)

**Frame:** `08-batch-payment-review.jpeg` (timestamp: ~75s)

**What We See:**

- "Review payments" modal
- Total amount: $83,345.78
- Payment date: "Today" with dropdown (showing calendar for February 2025)
- Debit account: "Checking – Manual account (•••• 9752)"
- Estimated arrival: "Feb 20 – 26, 2025"
- Four bills grouped by vendor:
  1. Amazon Business — ABZ4 · ACH (Direct deposit) — $27,284.92
  2. Amazon Business — "3 bills · Check by mail" (with "Batched" pill) — $56,060.86
  3. Expanded detail showing:
     - INV# ABZ3 — $5,703.42
     - INV# ABZ2 — $26,259.45
     - INV# ABZ1 — $24,097.99
- "Collapse" link to hide bill detail
- Bottom buttons: "Cancel" and "Pay now"

**What Narrator Says:**

> "Here we can see ramp has batch payments going to the same vendor. We're also able to schedule when we want our payments to go out. Let's go ahead and schedule these payments for today."

**Key Insight for Our Build:**

- Multiple imported bills can be batched into a single payment
- The invoice numbers (ABZ1, ABZ2, ABZ3, ABZ4) are preserved and displayed
- This is important for reconciliation: each bill maintains its identity even in batch payment
- For our system: we'd need to track which bills are part of a batch payment transaction
- The sync-back to Sage Intacct would need to mark all bills in the batch as paid

---

## 9. History Tab: Paid Bills Synced Back to Sage Intacct (1:28-1:35)

**Frame:** `09-history-paid-bills-sync.jpeg` (timestamp: ~90s)

**What We See:**

- Ramp Bills "History" tab (showing paid bills)
- Status filter: "Paid"
- Vendor filter: "Amazon Business"
- All four bills now show "Paid" status (green pill badge with checkmark icon)
- Payment date column: "Feb 12, 2025"
- All bills still labeled "Imported · Feb 3, 2025" or "Feb 2, 2025"
- Same amounts, due dates, and invoice identifiers as before
- Bottom: "1–4 of 4 matching bills · $83,345.78 total"

**What Narrator Says:**

> "Just like that our imported bills are set for payment. Once bills are paid in ramp they're automatically updated in your accounting system keeping everything in sync without the extra work."

**Key Insight for Our Build:**

- CRITICAL: Bidirectional sync — payment status flows BACK to Sage Intacct
- After payment execution in Ramp, the bill status is updated in the source ERP
- This requires a webhook or polling mechanism to push payment status back
- The "Imported" label persists even after payment (provenance tracking)
- Our system needs to handle:
  1. Import bills FROM ERP (create bill records with external_id)
  2. Execute payment in our system
  3. Push payment status BACK to ERP (mark bill as paid in Sage Intacct)

---

## 10. Sage Intacct: Bill Marked as Paid with EFT Reference (1:32-1:37)

**Frame:** `10-sage-intacct-bill-paid-status.jpeg` (timestamp: ~95s)

**What We See:**

- Sage Intacct Bill detail view for "Bill ABZ4"
- Transaction tab showing bill details:
  - Bill date: 02/02/2025
  - Due date: 03/04/2025
  - Bill total: 27,284.92 USD
  - Amount paid: 27,284.92 USD
  - Amount due: 0.00 USD
  - **Green "PAID" stamp overlay**
  - Paid in full on: 02/12/2025
  - Link: "EFT" (Electronic Funds Transfer reference)
- Vendor: "20114–Amazon Business (20114)" with link "View due"
- Pay to address: Amazon Business(V20114), 1 Broadway, New York, NY 10004, adp@ramp.com
- Bill number: ABZ4
- Reference number: ABZ4
- History tab showing audit trail:
  - Created by: emma
  - Created date: 02/02/2025 08:10:10 PM
  - Modified by: emma
  - Modified date: 02/12/2025 09:14:50 AM
  - Vendor: 20114–Amazon Business
  - Document number: ABZ4

**What Narrator Says:**
(Video transitions to outro/closing screen — no narration for this Sage Intacct frame)

**Key Insight for Our Build:**

- This is the DESTINATION of the sync-back process
- The bill in Sage Intacct is marked "PAID" after Ramp processes payment
- The paid date (02/12/2025) matches the Ramp payment execution date
- An "EFT" reference link is created (likely linking to the payment transaction in Sage)
- The modified date (02/12/2025 09:14:50 AM) shows when Ramp's API updated the bill status
- Our integration needs to:
  - Call Sage Intacct API to update bill status to "paid"
  - Provide payment date and payment method reference
  - Optionally create or link to a payment transaction record
- This closes the loop: create in Sage → import to Ramp → pay in Ramp → sync status back to Sage

---

## What We Take Into the Build

### 1. Provenance Model Validation

The video DIRECTLY validates our `external_id` / `source` / `provider_record_id` approach:

- Bills originate in Sage Intacct with a bill number (ABZ4, ABZ3, etc.)
- When imported, Ramp preserves this identifier and displays "Imported on [date]"
- The "Open in Sage Intacct" link requires storing the external record reference
- After payment, the status syncs BACK to the same bill in Sage Intacct using the external_id

**Schema Implications:**

```sql
bills (
  id UUID PRIMARY KEY,
  external_id TEXT,              -- "ABZ4" from Sage Intacct
  source TEXT,                   -- "sage_intacct"
  provider_record_id TEXT,       -- Full Sage record key if different from external_id
  provider_record_url TEXT,      -- Deep link: "Open in Sage Intacct"
  imported_at TIMESTAMPTZ,       -- "Imported on 2/3/25"
  last_synced_at TIMESTAMPTZ,    -- "last updated Feb 12, 11:40 AM"
  ...
)
```

### 2. Integration Configuration Requirements

Before bills can be imported, the integration requires:

- **Account mapping:** Link Ramp bank account → Sage Intacct cash account
- **Toggle activation:** "Import bills from Sage Intacct" ON/OFF switch
- **Sync frequency:** Real-time or periodic polling (video shows "last updated" timestamp)

**Configuration Schema:**

```sql
accounting_integrations (
  id UUID PRIMARY KEY,
  provider TEXT,                 -- "sage_intacct", "quickbooks", etc.
  enabled BOOLEAN,
  account_mappings JSONB,        -- { "ramp_account_id": "sage_cash_account_id" }
  sync_settings JSONB,           -- { "auto_import": true, "overbilling_protection": true }
  last_sync_at TIMESTAMPTZ,
  ...
)
```

### 3. Bidirectional Sync Flow

The integration is NOT one-way import — it's a full sync cycle:

**IMPORT (Sage → Ramp):**

- Poll Sage Intacct API for open/unpaid bills
- Create bill records in Ramp with `external_id` = Sage bill number
- Sync vendor, amount, due date, invoice number, line items
- Mark bills as "Imported" with source timestamp

**SYNC-BACK (Ramp → Sage):**

- After payment execution in Ramp, call Sage Intacct API
- Update bill status to "paid" with payment date and reference
- Optionally create payment transaction record in Sage (the "EFT" link)

**Edge Cases:**

- What if a bill is edited in Sage after import? (Re-sync or lock?)
- What if a bill is deleted in Sage? (Soft delete or orphan in Ramp?)
- What if payment fails? (Revert paid status in Sage?)

### 4. Bill Mapping: What Data Transfers

From the frames showing Sage Intacct and Ramp side-by-side:

| Sage Intacct Field | Ramp Field     | Notes                                  |
| ------------------ | -------------- | -------------------------------------- |
| Bill number (ABZ4) | Invoice number | Displayed in bill detail               |
| Vendor name        | Vendor         | Synced with vendor matching/creation   |
| Total amount       | Bill total     | Exact match required                   |
| Bill date          | Invoice date   | When bill was created in Sage          |
| Due date           | Due date       | For payment scheduling                 |
| Description        | Description    | Not visible in video but likely synced |
| Reference number   | —              | Sage-internal, may not sync            |

**Missing from video (but likely synced):**

- Line items (GL account, department, location, class, project)
- Attachments (PDF invoice if uploaded to Sage)
- Custom fields / dimensions

### 5. Sage Intacct Dimension Mapping (Inferred)

While the video doesn't show the line-item detail view, Sage Intacct uses these dimensions:

- **GL Account:** Required for each line item
- **Department:** Optional dimension
- **Location:** Optional dimension
- **Class:** Optional dimension
- **Project/Customer:** Optional dimension

**For Our Build:**
When importing bills from Sage Intacct, we'd need to:

- Sync line items with their dimension tags
- Map Sage dimensions to our internal categories/departments/locations
- Preserve the original dimension IDs for sync-back reconciliation

```sql
bill_line_items (
  id UUID PRIMARY KEY,
  bill_id UUID REFERENCES bills(id),
  gl_account_code TEXT,
  department_id UUID REFERENCES departments(id),
  location_id UUID REFERENCES locations(id),
  class_id UUID REFERENCES classes(id),
  project_id UUID REFERENCES projects(id),
  external_dimension_ids JSONB,  -- Preserve Sage dimension IDs
  ...
)
```

### 6. "Imported" Label & Sync Status UI

Ramp clearly distinguishes imported bills:

- Label: "Imported · Feb 3, 2025" (import date)
- Sync timestamp: "Imported bills last updated Feb 12, 11:40 AM"
- Deep link: "Open in Sage Intacct" (with external link icon)

**For Our Build:**

- Display import source and date in bill list view
- Show last sync timestamp for all imported bills
- Provide deep link back to source record in ERP
- Indicate sync status (synced, pending, error) if needed

### 7. Batch Payment & Multi-Bill Reconciliation

The review screen shows multiple bills batched into one payment, but each bill retains its invoice number (ABZ1, ABZ2, ABZ3).

**Implication:**
When syncing payment status back to Sage Intacct, we need to:

- Mark ALL bills in the batch as paid
- Provide the same payment date for all
- Optionally create ONE payment transaction in Sage that references all bill numbers
- Or create MULTIPLE payment records, one per bill

### 8. Overbilling Protection (Intelligence Layer)

The "Importing" settings tab shows an optional feature: "Flag unexpectedly high invoices" — this is Ramp's ML-powered anomaly detection.

**For Our Build:**

- This is NOT part of the core import/sync integration
- It's an additional intelligence layer on TOP of imported bills
- Validates against historical invoice amounts for the vendor
- Could be a future enhancement, not MVP

### 9. No Manual Upload UI for Imported Bills

Notice: The video shows NO upload button or CSV import for Sage Intacct bills.

**Key Distinction:**

- **Manual bills:** Created via "New bill" button, invoice PDF upload, email forwarding
- **Imported bills:** Automatically pulled from accounting system API, no upload needed

The "Try a sample invoice" and "New bill" buttons remain visible, but imported bills bypass this entirely.

**For Our Build:**

- Imported bills skip the manual data entry flow
- The bill creation source should be tracked: `created_by` (user) vs. `imported_from` (integration)

### 10. Payment Status Sync-Back is Automatic

The narrator emphasizes: "Once bills are paid in ramp they're automatically updated in your accounting system."

**No Manual Action Required:**

- User doesn't click "sync to Sage Intacct"
- No batch export or reconciliation step shown
- The sync happens behind the scenes immediately after payment execution

**For Our Build:**

- Payment processor should trigger webhook/event: "payment.completed"
- Event handler should call Sage Intacct API to update bill status
- Handle failures gracefully (retry queue, error logging, manual reconciliation UI)

---

## Summary: Sage Intacct Integration Seam

This video is DIRECTLY relevant to our external_id/source provenance model because it demonstrates:

1. **Bills originate in the accounting system** (Sage Intacct) with their own identifiers (bill numbers)
2. **Ramp imports these bills** via API integration, preserving the external_id and displaying "Imported" labels
3. **Deep links back to the source** require storing the provider record URL or constructing it from external_id
4. **Payment status syncs back** to Sage Intacct after execution, marking bills as "paid" in the source system
5. **Dimension mapping** is required: Sage Intacct's GL accounts, departments, locations, and classes need to map to our internal structures
6. **Batch payments** maintain individual bill identity (invoice numbers) even when grouped
7. **The sync is automatic and bidirectional**: no manual export/import steps

**This validates our approach:**

- `external_id` stores the Sage Intacct bill number (e.g., "ABZ4")
- `source` indicates "sage_intacct" (or other ERP)
- `provider_record_url` enables the "Open in Sage Intacct" deep link
- `imported_at` and `last_synced_at` track sync metadata
- Payment execution triggers a sync-back API call to update bill status in Sage Intacct

**Confidentiality Check:** No client-specific terms used. Only Ramp UI, Sage Intacct (publicly documented ERP), and generic AP workflow concepts.
