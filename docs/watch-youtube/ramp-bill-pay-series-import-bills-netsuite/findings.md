# Ramp Bill Pay Series: Import Bills - NetSuite

**Source:** [YouTube](https://www.youtube.com/watch?v=c-kFcNwD5Bs)
**Duration:** 1:57
**Captured:** 2026-07-03

---

## Overview

This video demonstrates Ramp's NetSuite bill import integration, showing how bills created in NetSuite can automatically sync into Ramp for payment processing, then sync back to NetSuite after payment. This is a critical external-system integration pattern showing how Ramp maintains bidirectional sync with accounting platforms while preserving source-of-truth relationships.

---

## NetSuite Bill Structure & Dimensions

### What We See: Bill Record in NetSuite (0:17-0:23)

**Frame:** `01-netsuite-bill-detail-view.jpeg` (timestamp ~0:18)

The NetSuite bill shows these key fields and dimensions:

- **Transaction Number:** 20 (NetSuite internal ID)
- **Reference No:** 513581 (external invoice number)
- **Vendor:** Amazon
- **Account:** 2010 Accounts Payable : Accounts Payable - Trade
- **Amount:** 3,514.92 USD
- **Due Date:** 6/5/2024
- **Approval Status:** Approved
- **Classification section** showing:
  - **Subsidiary:** US East MA
  - **CUSTOM_SEGMENT (HEADER ONLY)** (visible but empty)
  - **CUSTOM_SEGMENT (BOTH)** (visible but empty)
- **RAMP_RECEIPT_URL** field (custom field for integration)
- **Line items** with columns: CATEGORY, ACCOUNT, AMOUNT, TAX AMOUNT, GROSS AMT, MEMO, DEPARTMENT, CLASS, LOCATION, CUSTOMER, BILLABLE, AMORTIZATION columns

**Key insight:** NetSuite uses a multi-dimensional classification model (Subsidiary, Department, Class, Location) at both header and line-item levels. Ramp must map and preserve these dimensions during import/sync.

---

## Ramp Import Configuration

### What We See: Bill Pay Settings - Importing Tab (0:27-0:33)

**Frame:** `02-import-bills-toggle-enabled.jpeg` (timestamp ~0:28)

The settings panel shows:

**Tab Navigation:** Payments | Permissions | Approvals | Accounting | **Importing** (active)

**Editing settings for:** Finance's Tofu Speakeasy (entity selector dropdown)

**Main Section:** "Pay bills from NetSuite on Ramp"

**Toggle Setting:**
- Label: "Import bills from NetSuite"
- State: **ENABLED** (green toggle, ON position)
- Help text visible: "Ramp will now import bills from NetSuite"
- Link: "Learn more about importing bills"

**Additional Features:**
- Diagram showing PO/Invoice/Item receipt relationship flow
- "Automatically import purchase orders" section (Plus badge)
  - Description: "Ramp will automatically import your POs from NetSuite to match invoices and link bills"
  - Toggle: "Automatically import purchase orders" (ENABLED)

**Key insight:** This is a simple one-click enablement model. No visible field-mapping UI or dimension-mapping configuration shown in this view. The integration appears pre-configured or uses convention-over-configuration defaults.

---

## Imported Bills in Ramp

### What We See: Bills List - "For payment" Tab (0:40-0:50)

**Frame:** `03-ramp-bills-for-payment-list.jpeg` (timestamp ~0:35)

The bills list shows imported bills with these indicators:

**Filter/Status Pills:** Status: Ready for release | Scheduled | Initiated | +7 | Vendor: Amazon

**Table Columns:**
- Vendor / owner
- Status (yellow badges: "Ready for release")
- Amount
- Payment date (mostly showing "—")
- Due date (showing "Overdue" in red for most)
- Invoice
- Actions (Release button)

**Imported Bill Indicators:**
- Each Amazon bill row shows: "Imported · Feb 3, 2025"
- Icon: small building/institution icon (likely indicating external source)
- All bills are from same vendor (Amazon) with various amounts: $3,544.20, $5,464.98, $2,538.53, $3,514.92, etc.

**Key insight:** Ramp clearly labels imported bills with import date and icon, maintaining provenance. Status shows "Ready for release" (not auto-released), giving users control over payment scheduling.

---

## Bill Detail: External ID & Deep Link

### What We See: Imported Bill Detail (0:52-1:00)

**Frame:** `04-imported-bill-detail-with-netsuite-link.jpeg` (timestamp ~0:55)

The bill detail panel shows:

**Header:**
- Vendor: Amazon
- Subtitle: "Finance's Tofu Speakeasy · INV# # 513581 · **Imported on 2/3/25** · **Open in NetSuite** 🔗"

**Payment Status Progress:**
- Current: "Overdue — Unscheduled"
- Stages: Awaiting approvals | Scheduled | Payment initiated | Payment delivered

**Bill Details Section:**
- Vendor: Amazon (johndoe@ramp.com)
- Invoice number: **# 513581**
- Invoice date: 6/5/2024
- Due date: 6/5/2024
- Bill total: **$3,514.92**

**Key insight:** Ramp preserves the NetSuite invoice number (513581) as the bill's external identifier and provides a deep link back to NetSuite ("Open in NetSuite"). This shows clear source provenance and enables round-tripping for audit/reconciliation.

---

**Frame:** `05-imported-bill-open-in-netsuite.jpeg` (timestamp ~0:58)

Same view with cursor hovering over "Open in NetSuite" link, confirming interactive deep-linking back to the source system.

**Key insight:** This link likely uses the NetSuite record ID or similar stable identifier to maintain the connection. The external_id concept is critical here.

---

## Payment Method Selection & Optimization

### What We See: Payment Method Picker (1:06-1:20)

**Frame:** `06-payment-method-options-card-flagged.jpeg` (timestamp ~1:10)

**Header:** "How do you want to pay $3,514.92?"

**Payment Methods Listed:**

1. **ACH (Direct deposit)** ✓ (selected)
   - "Pay directly from your bank account"

2. **Domestic wire** (New badge)
   - "Pay US-based bank accounts"

3. **Check by mail**
   - "Ramp will debit your bank and mail a check to your vendor's address"

4. **International wire**
   - "Pay international bank accounts in USD via SWIFT. Additional fees apply."

5. **Pay with Ramp Card** (1% cashback badge - highlighted)
   - "Use an existing card or create a new, single-use card just for this bill"

6. **I won't pay this with Ramp**
   - "Create, track, and approve this bill with Ramp but make the payment manually"
   - Link: "Discard changes"

**Key insight:** Ramp actively flags card payment opportunities with cashback incentives, showing intelligence in payment routing optimization. This suggests Ramp may analyze vendor acceptance capabilities.

---

## Bulk Payment & Batching

### What We See: Review Payments - Batch Summary (1:23-1:36)

**Frame:** `07-bulk-payment-review-batched.jpeg` (timestamp ~1:28)

**Panel Header:** "Review payments"

**Summary:**
- Total amount: **$25,923.29**
- Payment date: **Today** (dropdown)
- Estimated arrival: Mar 4, 2025
- Debit from: Checking — Manual account (•••• 1873)

**Batched Vendor:**
- Amazon (icon: A in circle)
- "8 bills · ACH (Direct deposit)" — **Batched** badge
- Amount: **$25,923.29**

**Individual Bills Expanded:**
- INV# # 3564561 — $3,544.20
- INV# 776644 — $5,464.98
- INV# 101 — $2,538.53
- INV# # 513581 — $3,514.92
- INV# INV549684 — $4,841.47
- INV# INV700678 — $1,333.10

**Action Button:** "Release payments" (green)

**Key insight:** Ramp intelligently batches multiple bills to the same vendor into a single payment, optimizing payment execution and reducing transaction costs. The "Batched" label is explicit. Each bill preserves its distinct invoice number even when batched.

---

## Sync Back to NetSuite After Payment

### What We See: NetSuite Bill Payment Record (1:45-1:47)

**Frame:** `08-netsuite-bill-payment-synced-back.jpeg` (timestamp ~1:45)

NetSuite now shows a **Bill Payment** record (not just a Bill):

**Primary Information:**
- **Transaction Number:** 13
- **Payee:** Amazon
- **Account:** 1011 Cash : Checking - US East
- **Balance:** 886,441.57
- **Amount:** 3,514.92 USD
- **Currency:** USA
- **Exchange Rate:** 1.00
- **Date:** 2/25/2025
- **Posting Period:** Feb 2025
- **Check #:** 3

**Classification:**
- **Subsidiary:** US East MA
- **Department:** (empty)
- **Class:** (empty)
- **Location:** (empty)

**RAMP_RECEIPT_URL:** (custom field, populated by integration)

**Apply Tab (bottom section):**
- Shows "Applied To 3,514.92" / "Credits Applied 0.00"
- **Line item:** Date Due 6/5/2024 | Type: Bill | Ref No. 513581 | Orig. Amt. 3,514.92 | Amt. Due 3,514.92 | Currency USA | Disc. Date/Avail/Taken (empty) | Payment 3,514.92

**Key insight:** After Ramp processes the payment, the integration creates a Bill Payment record in NetSuite that:
1. Links back to the original Bill (ref 513581) via the "Apply" tab
2. Records the payment amount and date
3. Assigns a check number (even for ACH, likely for reconciliation)
4. Updates the GL account (Cash/Checking)
5. Preserves subsidiary classification

This demonstrates **bidirectional sync** — bills flow from NetSuite → Ramp for payment, then payment records flow back Ramp → NetSuite for GL reconciliation.

---

## What We Take Into the Build

### 1. External ID / Source Provenance Model

**What Ramp does:**
- Preserves NetSuite invoice number (513581) as the bill identifier
- Shows "Imported on 2/3/25" timestamp
- Provides "Open in NetSuite" deep link back to source record
- Uses icon badge to indicate external origin

**For our build:**
- Bills table needs `external_id` (NetSuite internal ID or transaction number)
- Bills table needs `source` enum (netsuite, quickbooks, sage, xero, manual)
- Bills table needs `imported_at` timestamp
- UI must show provenance clearly (icon + label + link)
- Need integration_metadata JSONB for storing source-system-specific fields

---

### 2. Dimension Mapping & Classification Sync

**What Ramp syncs from NetSuite:**
- Subsidiary (US East MA)
- Department, Class, Location (shown as columns in line items)
- Custom segments (CUSTOM_SEGMENT HEADER ONLY, CUSTOM_SEGMENT BOTH)
- Account codes (2010 Accounts Payable, 6060 Expenses:Selling Expenses:Advertising)

**For our build:**
- Need `accounting_dimensions` JSONB on bills and line_items tables
- Schema should support: `{subsidiary, department, class, location, account_code, custom_segments: {...}}`
- Integration must map NetSuite classifications → Ramp entities (or preserve as-is)
- Consider: does our GL_account table need subsidiary/entity scoping?
- Sync must preserve multi-level hierarchy (header vs line-item dimensions)

---

### 3. Bidirectional Sync Architecture

**What we observed:**
- **Inbound (NetSuite → Ramp):** Bill records flow in when "Import bills from NetSuite" is enabled
- **Outbound (Ramp → NetSuite):** Bill Payment records flow back after payment execution
- **Field Mapping:** Invoice number, vendor, amount, dates, classification dimensions
- **Link Preservation:** Ramp stores NetSuite record ID; NetSuite stores RAMP_RECEIPT_URL

**For our build:**
- Integration layer needs webhook listeners for NetSuite bill creation/updates
- Payment processor must trigger outbound sync after payment completion
- Need `sync_status` tracking (pending, synced, failed) on bills
- Need `last_synced_at` timestamp
- Consider: conflict resolution if bill modified in both systems
- Link back to source system via stored external_id

---

### 4. Import Configuration & Entity Scoping

**What Ramp shows:**
- Settings scoped per entity ("Editing settings for Finance's Tofu Speakeasy")
- Simple toggle: "Import bills from NetSuite" (ON/OFF)
- Additional feature: "Automatically import purchase orders" (Plus tier)

**For our build:**
- `accounting_integrations` table with columns: entity_id, provider (netsuite/qbo/xero), import_enabled, sync_frequency
- `integration_settings` JSONB for provider-specific config (subsidiary filter, account mappings)
- Entity-level scoping: each legal entity can have different integration config
- Consider: multi-subsidiary NetSuite → multi-entity Ramp mapping

---

### 5. Payment Batching & Vendor Consolidation

**What Ramp does:**
- Batches 8 bills to Amazon into single $25,923.29 payment
- Each bill retains distinct invoice number
- UI shows "Batched" badge explicitly

**For our build:**
- Payment execution layer must group by vendor+payment_method+payment_date
- `payments` table schema: one payment → many bills (via junction table or bills.payment_id FK)
- UI must show batch summary with expandable bill list
- Batching logic: same vendor, same entity, same payment account, same scheduled date

---

### 6. Status Model & Approval Workflow

**What Ramp shows:**
- Imported bills land in "Ready for release" status (not auto-released)
- Payment status stages: Awaiting approvals → Scheduled → Payment initiated → Payment delivered
- User must explicitly click "Release payment" button

**For our build:**
- Bill status enum: `imported, awaiting_approval, approved, scheduled, payment_initiated, paid`
- Payment status enum: `pending, scheduled, processing, completed, failed`
- Approval workflow separate from payment execution
- Integration import should NOT auto-approve (requires explicit user action)

---

### 7. Deep Linking & Round-Trip Audit

**What Ramp provides:**
- "Open in NetSuite" link from bill detail
- Likely format: `https://{instance}.netsuite.com/app/accounting/transactions/vendbill.nl?id={internal_id}`

**For our build:**
- Store NetSuite instance URL in integration config
- Construct deep links dynamically: `{instance_url}/app/accounting/transactions/{record_type}.nl?id={external_id}`
- UI component: "View in NetSuite" button/link on imported bill details
- Audit log: track when users click through to source system

---

### 8. Payment Method Intelligence

**What Ramp shows:**
- Flags card payment opportunities with "1% cashback" badge
- Offers 6 payment methods: ACH, Wire, Check, International Wire, Card, Manual

**For our build:**
- Payment method enum: `ach, domestic_wire, international_wire, check, card, manual`
- Vendor payment_methods junction table (vendor accepts card: yes/no)
- Payment optimizer: if vendor accepts card, flag for cashback opportunity
- Card payment limits and approval rules (may differ from ACH)

---

## Summary: Integration & Data Model Implications

1. **External ID is first-class:** Not optional. Every imported bill MUST have external_id + source + imported_at.
2. **Dimensions are critical:** NetSuite's subsidiary/department/class/location model must map to our chart of accounts or be stored as JSONB metadata.
3. **Bidirectional sync is complex:** Need robust webhook handling, sync status tracking, conflict resolution strategy.
4. **Batching is expected:** Payment execution layer must intelligently batch by vendor while preserving bill-level detail.
5. **Provenance must be visible:** UI must always show "Imported from NetSuite" with link back to source.
6. **Entity scoping matters:** Integration config is per legal entity, not global.
7. **Status model is multi-stage:** Import → Approval → Scheduling → Execution → Sync Back.
8. **Deep linking is essential:** Users need seamless navigation between Ramp and NetSuite for audit/reconciliation.
