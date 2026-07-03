# Ramp Bill Pay: Import Bills from QuickBooks Online

**Source:** [Ramp Bill Pay Series: Import Bills - Quick Books Online](https://www.youtube.com/watch?v=7dWYTd1ZuG8)
**Duration:** 117 seconds (1:57)
**Summary:** Demonstrates Ramp's bill import integration with QuickBooks Online, showing how bills created in QBO automatically sync to Ramp for payment while maintaining bidirectional sync.

**Related artifacts:**
- [Video captions](./captions.vtt)
- [Screenshots](./snapshots/)

---

## Overview

This video showcases Ramp's accounting system integration for bill importing, specifically with QuickBooks Online. The integration allows companies to continue creating bills in their existing accounting system while leveraging Ramp's payment capabilities and cashback opportunities.

---

## Key Features Observed

### 1. QuickBooks Online Bills View (0:16-0:24)

**Screenshot:** `01-qbo-bills-view.jpeg` (at 0:18)

**What we SAW:**
- QuickBooks Online Expenses interface showing vendor "Amazon Business" with multiple bills
- Bill list displays: Date (01/22/2025), Type (Bill), Number (ABZ#), Payee, Category (Equipment Rental), Total, and Action (Schedule payment)
- Bills shown with status indicators and "Schedule payment" buttons
- Left sidebar shows accounting categories: Expenses, Bills, Vendors, Contractors, Mileage, 1099 filings
- Summary panel displays "Open balance" and "Overdue payment" totals

**What was NARRATED:**
> "Here we are looking at open bills in our accounting system. These are bills that have already been created and approved."

**Integration insight:** Bills originate in QuickBooks Online with full accounting metadata (category, vendor, invoice number) before syncing to Ramp.

---

### 2. Bill Import Settings - Enabling Integration (0:24-0:30)

**Screenshot:** `02-import-toggle-enabled.jpeg` (at 0:27)
**Screenshot:** `03-import-settings-tab.jpeg` (at 0:27)

**What we SAW:**
- Ramp "Bill Pay settings" modal with tabs: Payments, Permissions, Approvals, Accounting, **Importing** (active)
- Success notification: "Ramp will now import bills from QuickBooks"
- Toggle: "Import bills from QuickBooks" (enabled/green)
- Additional features (Plus tier):
  - "Automatically import purchase orders" toggle
  - "Overbilling protection" with option to "Flag unexpectedly high invoices"
- Link: "Learn more about importing bills"

**What was NARRATED:**
> "By enabling Bill importing these bills sync automatically into ramp no manual uploads or extra steps needed."

**Integration insight:** The import is a simple toggle in settings. Once enabled, it's a one-way sync from QBO → Ramp. The presence of "Automatically import purchase orders" suggests PO-to-invoice matching capability.

---

### 3. Imported Bills in Ramp "For Payment" Tab (0:35-0:45)

**Screenshot:** `04-for-payment-tab-imported-bills.jpeg` (at 0:40)

**What we SAW:**
- Ramp Bills interface with tab navigation: Overview, Drafts, For approval, **For payment** (active), History
- Yellow banner: "Imported bills last updated Jan 24, 2025, 10:30 AM" with "Refresh" button
- Bill list showing multiple "Amazon Business" bills, all marked "Imported - Jan 23, 2025"
- Status badges: "Unscheduled" (red/pink) with overdue dates
- Columns: Vendor/owner, Status, Amount, Payment date, Due date, Invoice date, Actions
- Each bill has a "Pay now" button and envelope icon (indicating bill available)
- Filter chips: Status (Ready for release, Scheduled, Initiated, +7), Vendor (Amazon Business), + Filter

**What was NARRATED:**
> "Imported bills land in the for payment tab ready to be scheduled and as new bills are created we automatically bring them in too so nothing gets missed."

**Integration insight:**
- Bills land directly in "For payment" tab, not requiring approval workflow (already approved in QBO)
- "Imported" label + import timestamp appears on each bill
- Sync is continuous ("as new bills are created we automatically bring them in")

---

### 4. Bill Detail - Imported Label & External Reference (0:46-0:57)

**Screenshot:** `05-bill-detail-imported-label.jpeg` (at 0:52)
**Screenshot:** `06-bill-open-in-quickbooks-link.jpeg` (at 0:57)
**Screenshot:** `07-bill-details-full.jpeg` (at 0:57)

**What we SAW:**
- Bill header: "Amazon Business →" with external link indicator
- Import metadata: "INV# ABZ3 · Imported on 1/23/25 · **Open in QuickBooks**" (clickable link)
- Payment status: "Overdue — Unscheduled" with progress bar
- Bill details section showing:
  - Vendor: Amazon Business
  - Invoice number: ABZ3
  - Invoice date: 1/22/2025
  - Due date: 1/22/2025
  - Bill total: $5,703.42
- Payment details section with method selector (Check - Unscheduled)
- "Schedule payment" button in top right

**What was NARRATED:**
> "Imported bills include all key details like vendor amount and invoice number you can also easily navigate to your accounting system to reference the original bill."

**Integration insight:**
- "Open in QuickBooks" deep link enables round-trip navigation back to source system
- Invoice number (ABZ3) is preserved from QBO as the external reference ID
- This demonstrates the **external_id/source** concept: Ramp maintains a link to the originating system's record

---

### 5. Payment Method Selection (1:00-1:09)

**Screenshot:** `08-payment-methods-selector.jpeg` (at 1:05)

**What we SAW:**
- Payment method dropdown showing options:
  - **ACH (Direct deposit)** - "Pay directly from your bank account"
  - **Domestic wire** - "Pay US-based bank accounts" (New badge)
  - **Check by mail** - "Ramp will debit your bank and mail a check to your vendor's address" (selected)
  - **Pay with Ramp card** - "Use an existing card or create a new, single-use card just for this bill" (1% cashback badge)
  - "I won't pay this with Ramp" - "Create, track, and approve this bill with Ramp but make the payment manually"
- Promotional banner: "Get $5703 cashback when you pay by card"

**What was NARRATED:**
> "With ramp you have multiple ways to pay ACH check wire or card ramp even Flags opportunities to pay by card helping you maximize cash back whenever possible."

**Integration insight:**
- Ramp offers more payment methods than typical accounting systems
- Intelligent cashback opportunity detection
- Even if not paying via Ramp, bill can still be tracked in the system

---

### 6. Batch Payment & Scheduling (1:16-1:34)

**Screenshot:** `09-batch-payment-review.jpeg` (at 1:25)

**What we SAW:**
- "Review payments" modal showing:
  - Total amount: $135,520.25
  - Payment date: "Today" with estimated arrival Jan 31 - Feb 6, 2025
  - Two payment groups:
    1. Amazon Business - ABZ3 - ACH (Direct deposit) - $5,703.42
    2. Amazon Business - 7 bills - Check by mail - **Batched** - $129,816.83
  - "Pay now" button (green)

**What was NARRATED:**
> "Now let's prepare our payment here we can bulk select and see that ramp has batched payments going to the same vendor. We're also able to schedule when we want our payments to go out let's schedule these payments for today."

**Integration insight:**
- Intelligent batching for same vendor (7 bills → 1 check)
- Mixed payment methods in single batch (ACH + Check)
- Scheduling UI shows estimated delivery windows

---

### 7. Bidirectional Sync - Bills Updated in QBO (1:39-1:58)

**Screenshot:** `10-qbo-bills-updated-paid.jpeg` (at 1:45)

**What we SAW:**
- Back in QuickBooks Online interface
- Bills now showing "Paid" status (green checkmarks) with payment date "Jan 24, 2025"
- "Categorize" button tooltip visible, suggesting bulk categorization workflow
- Same bill list as beginning, but with updated status

**What was NARRATED:**
> "And just like that all of our imported bills are set for payment once bills are paid in ramp they're automatically updated in your accounting system keeping everything in sync without extra work."

**Integration insight:**
- **Bidirectional sync**: Payment status flows back from Ramp → QuickBooks
- Bills marked as "Paid" in QBO after Ramp processes payment
- Payment date recorded in source system
- Closes the loop: QBO remains source of truth for accounting records

---

## Data Model Insights

### External ID / Source Provenance

The integration demonstrates several key patterns relevant to our external_id/source model:

1. **Invoice Number as External ID**
   - QBO invoice numbers (ABZ3, ABZ4, etc.) are preserved in Ramp
   - Displayed prominently in bill headers and lists
   - Acts as the foreign key linking Ramp bills → QBO bills

2. **Import Timestamp Metadata**
   - "Imported on 1/23/25" label on every bill
   - "Last updated" timestamp in banner (Jan 24, 2025, 10:30 AM)
   - Tracks sync provenance and freshness

3. **Deep Linking to Source**
   - "Open in QuickBooks" link enables navigation to source record
   - Suggests Ramp stores QBO record ID (internal) + URL pattern
   - Round-trip navigation maintains context

4. **Sync Direction Indicators**
   - "Imported" label clearly marks bills originating in QBO
   - Distinguishes from bills created natively in Ramp
   - Status updates flow back to source system

### Accounting Dimension Mapping

From the QuickBooks view, we observe these dimensions that must map to Ramp:

- **Category/Account** - "Equipment Rental" (QBO chart of accounts)
- **Vendor** - "Amazon Business" (vendor master)
- **Invoice metadata** - Number, Date, Due Date, Amount
- **Location/Class/Customer** - Not visible in this demo but standard QBO dimensions

The video doesn't show how these dimensions are mapped in Ramp's UI, but the Category field is clearly preserved.

---

## What We Take Into the Build

### 1. External Integration Pattern

**For bills from external systems (QuickBooks, Sage, Xero, NetSuite):**

```typescript
// Bill entity should track source
interface Bill {
  id: string;
  source: 'ramp' | 'quickbooks' | 'xero' | 'sage' | 'netsuite';
  externalId?: string;        // Invoice number from source system
  externalUrl?: string;        // Deep link to source record
  importedAt?: Date;
  lastSyncedAt?: Date;
  // ... other fields
}
```

### 2. Import Status Visibility

- Display "Imported" badge on bills from external sources
- Show import timestamp ("Imported on 1/23/25")
- Provide "Last synced" timestamp at list level
- Enable manual refresh to pull latest bills

### 3. Bidirectional Sync Requirements

- **Inbound (QBO → Ramp):** Bill metadata, vendor, amounts, due dates
- **Outbound (Ramp → QBO):** Payment status, payment date, payment method
- Sync should be **near real-time** for status updates
- Maintain sync health indicators ("Last updated...")

### 4. Deep Linking UX

- "Open in [Source System]" link in bill detail header
- External link icon (→) to indicate navigation outside Ramp
- Preserve context: link should open specific bill record in source system

### 5. External ID Handling

- **Invoice number** is the primary external reference
- Store in `externalId` field (or `invoiceNumber` if common across sources)
- Display prominently in bill lists and headers
- Use for deduplication during sync

### 6. Import Settings UI

- Simple toggle to enable/disable bill importing per integration
- Per-integration configuration (e.g., QuickBooks vs Xero)
- Advanced options: auto-import POs, overbilling protection
- Clear success/error messaging on toggle

### 7. Workflow Implications

- Imported bills skip approval workflow (already approved in source)
- Land directly in "For payment" status
- Cannot edit core fields (vendor, amount, date) - source is truth
- Can add Ramp-specific metadata (payment method, schedule)

### 8. Sync Conflict Handling

- If bill deleted in QBO, should it auto-archive in Ramp?
- If amount changes in QBO after import, trigger re-sync?
- Payment made outside Ramp → sync back to prevent duplicate payment

### 9. Batch Payment Intelligence

- Auto-detect bills going to same vendor
- Suggest batching into single payment (especially checks)
- Show combined total but preserve individual bill references

### 10. Source System as Truth

- QBO remains the source of truth for accounting dimensions
- Ramp adds payment orchestration layer
- Status updates sync back to maintain consistency
- Never mutate source data, only add Ramp-specific context

---

## Open Questions (Not Shown in Video)

1. **Dimension Mapping:** How do QBO Categories map to Ramp Categories? Is there a mapping UI?
2. **Multi-Entity:** How does this work for multi-entity orgs with multiple QBO instances?
3. **Conflict Resolution:** What happens if same invoice number exists in both systems?
4. **Partial Payments:** Can you partially pay an imported bill? Does that sync back?
5. **Custom Fields:** Do QBO custom fields sync to Ramp?
6. **Purchase Orders:** How do imported POs match to bills?
7. **Vendor Mapping:** Is vendor auto-matched by name, or does user map QBO vendor → Ramp vendor?

---

## Technical Validation

This video directly validates our architectural decisions around:

1. **`external_id` field on bills table** - Stores QBO invoice number
2. **`source` enum on bills** - Distinguishes imported vs native bills
3. **Sync timestamps** - Track import and last sync times
4. **Deep linking** - Store source URL pattern for navigation
5. **Status sync** - Payment status must flow back to source system
6. **Read-only imported fields** - Core bill data locked when source is external
7. **Integration settings** - Per-provider toggle and configuration
8. **Batch intelligence** - Vendor grouping and payment optimization

The QuickBooks integration demonstrates a mature, production-ready pattern we should emulate for our accounting system integrations.
