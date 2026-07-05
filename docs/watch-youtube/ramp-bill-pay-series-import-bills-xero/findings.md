# Ramp Bill Pay: Import Bills from Xero

**Video:** [Ramp Bill Pay Series: Import Bills - Xero](https://www.youtube.com/watch?v=kXxYMAHFc0k)
**Duration:** 111 seconds
**Captured:** 2026-07-03

---

## Overview

This video demonstrates Ramp Bill Pay's **accounting system integration** feature, specifically showing how bills created in Xero can be automatically imported into Ramp for payment. This is the accounting-integration seam where external bill records flow into Ramp's payment system while maintaining bidirectional sync.

**Key insight:** Bills maintain their identity and provenance from Xero throughout the entire payment lifecycle in Ramp, then sync status back to Xero after payment.

---

## 1. Source System: Bills in Xero (0:05-0:20)

**What we see:** `01-xero-awaiting-payment-bills.jpeg` (0:10)

The video opens in Xero's accounting system showing the "Bills" view filtered to "Awaiting payment" status. This is the source of truth where bills are created and approved.

**UI observations:**

- Xero bills table with vendor "Amazon Business"
- Reference numbers: ABZ9, ABZ8, ABZ7, ABZ6, ABZ5, ABZ4, ABZ3, ABZ25
- Date column shows "Jan 22, 2025" (invoice date)
- Due date column shows "Feb 05, 2025"
- "Paid" column shows 0.00 (unpaid status)
- "Due" column shows amounts: $9,377.19, $19,842.18, $21,650.14, $2,913.09, $7,769.06, $27,284.92, $5,703.42, $8,430.25

**Narrated (0:05-0:20):**

> "Ramp bill pay now imports bills directly from your accounting system so you can keep creating bills exactly as you do today while unlocking more ways to pay and greater efficiency. Here we're looking at our open bills in our accounting system. These are bills that have already been created and approved."

**Takeaway:** Bills are created and approved in the accounting system first, following existing AP workflows. Ramp does not replace the accounting system as the source of truth for bill creation.

---

## 2. Enabling Bill Import in Xero Settings (0:23-0:28)

**What we see:** `02-import-bills-toggle.jpeg` (0:25)

A settings panel titled "Bill Pay settings" appears, showing the "Importing" tab with a toggle control.

**UI observations:**

- Tab navigation: Payments, Permissions, Approvals, Accounting, **Importing** (active)
- Section: "Pay bills from Xero on Ramp"
- Toggle control: "Import bills from Xero" (shown being enabled)
- Link: "Learn more about importing bills"
- Below: "Overbilling protection" (Plus feature)

**Narrated (0:23-0:28):**

> "In Ramp we can enable bill importing and these bills will automatically sync into Ramp."

**Takeaway:** Import is controlled via a single toggle in Ramp settings. Once enabled, bills flow automatically without manual uploads.

---

## 3. Imported Bills Land in Ramp "For payment" (0:28-0:38)

**What we see:**

- `03-ramp-overview-empty-state.jpeg` (0:30) - Transition screen
- `04-for-payment-imported-bills.jpeg` (0:35)

After enabling the toggle, we transition to Ramp's Bill Pay interface. Bills now appear in the "For payment" tab.

**UI observations:**

- Left nav: Bill Pay > Bills (active)
- Tab structure: Overview, Drafts, For approval, **For payment** (active), History
- Yellow notification banner: "Imported bills last updated Jan 24, 2025, 10:06 AM" with "Refresh" button
- Vendor filter: "Amazon Business"
- Bill list showing:
  - Vendor/owner: "Amazon Business" with "AB" avatar
  - Status badge: "Unscheduled" (red/orange)
  - "Imported · Jan 23, 2025" label under each vendor name
  - Amount, Payment date, Due date, Invoice date columns
  - "Pay now" action button

**Bills shown:**

- ABZ25: $8,430.25 | Due Feb 5, 2025 | Invoice Jan 22, 2025
- 7 more bills with similar pattern

**Narrated (0:28-0:40):**

> "No manual uploads or extra steps needed. Imported bills land in the 'for payment' tab ready to be scheduled, and as new bills are created will automatically bring them in too, so nothing gets missed."

**Takeaway:**

- Imported bills skip the approval workflow (since they were already approved in Xero)
- They land directly in "For payment" status
- Bills are clearly labeled "Imported · [date]" to distinguish them from native Ramp bills
- Sync status is visible with timestamp and refresh control

---

## 4. Bill Detail: Imported Metadata & Provenance (0:43-0:53)

**What we see:**

- `05-bill-detail-imported-metadata.jpeg` (0:48)

Clicking into a bill shows the detail view with imported metadata and deep link back to Xero.

**UI observations:**

- Header: "Amazon Business" with arrow icon
- Sub-header: "INV# ABZ25 · Imported on 1/23/25 · **Open in Xero**" (link with arrow)
- Tabs: Overview (active), Activity (6)
- Payment status: "Unscheduled"
- Bill details section showing:
  - Vendor: Amazon Business (mm@ramp.com)

**Narrated (0:45-0:53):**

> "Imported bills include all key details like vendor, amount, and invoice number. You can also easily navigate to your accounting system to reference the original bill."

**Takeaway:**

- **"Open in Xero" deep link** allows users to jump back to the source record
- Invoice number (ABZ25) is preserved from Xero
- Import timestamp creates an audit trail
- The bill maintains a reference to its Xero origin throughout its lifecycle in Ramp

---

## 5. Payment Setup: Imported Bill Details (0:48-0:53)

**What we see:** `06-payment-setup-imported-details.jpeg` (0:50)

The "Set up for payment" drawer shows imported bill details at the top.

**UI observations:**

- Header: "Set up for payment"
- Sub-header: "Imported on 1/23/25 · Open in Xero" link
- Section: "Imported bill details"
- Card showing:
  - Vendor: Amazon Business (mm@ramp.com)
  - Invoice number: ABZ25
  - Invoice date: 1/22/2025
  - Due date: 2/5/2025
  - Bill total: $8,430.25

**Takeaway:** All Xero metadata (invoice number, dates, amount) flows through to payment setup, maintaining the connection to the external source record.

---

## 6. Payment Methods & Cashback Intelligence (0:56-1:07)

**What we see:** `07-payment-methods-cashback.jpeg` (1:00)

The payment method selector shows Ramp's intelligence about card acceptance and cashback opportunities.

**UI observations:**

- Question: "How do you want to pay $8,430.25?"
- Blue callout card: "Get $84.30 cashback when you pay by card"
  - Explanation: "Amazon Business accepts card payments. Pay with a Ramp card and earn $84.30."
  - Actions: "Switch to card" | "Request live demo"
- Payment method dropdown showing:
  - **Check by mail** (selected)
  - ACH (Direct deposit) - "Pay directly from your bank account"
  - Domestic wire - "Pay US-based bank accounts" (New badge)
  - Check by mail - "Ramp will debit your bank and mail a check to your vendor's address" (checkmark)
  - Pay with Ramp card - "Use an existing card or create a new, single-use card just for this bill" (1% cashback badge)
  - I won't pay this with Ramp - "Create, track, and approve this bill with Ramp but make the payment manually"

**Narrated (0:56-1:07):**

> "With Ramp you have multiple ways to pay: ACH, check, wire, or card. Ramp even flags opportunities to pay by card, helping you maximize cash back whenever possible."

**Takeaway:** Ramp surfaces card acceptance intelligence specific to the vendor, enabling cashback optimization even for bills that originated in Xero.

---

## 7. Batch Payment Review (1:09-1:20)

**What we see:** `08-batch-review-payments.jpeg` (1:15)

Multiple bills can be selected and reviewed together before scheduling.

**UI observations:**

- Modal: "Review payments"
- Total amount: $102,970.25
- Payment date: "Today" dropdown
- Sub-text: "Debit from Checking - Manual Account (•••• 9752)"
- Estimated arrival: "Jan 31 – Feb 6, 2025"
- Two payment groups:
  1. Amazon Business - ABZ25 - ACH (Direct deposit) - $8,430.25
  2. Amazon Business - 7 bills - Check by mail (Batched) - $94,540.00
- Actions: "Cancel" | "Pay now" (green button)

**Narrated (1:09-1:23):**

> "Now let's prepare our payment. We can bulk select and see that Ramp has batch payments going to the same vendor. We're also able to schedule when we want our payments to go out. Let's schedule these payments for today."

**Takeaway:**

- Ramp intelligently batches multiple bills to the same vendor
- Payment methods can differ within a batch
- Scheduling is flexible (date picker shown)

---

## 8. Payment Success & Status Sync (1:23-1:35)

**What we see:** `09-scheduled-payments-success.jpeg` (1:25)

After scheduling, bills transition to "Initiated" status.

**UI observations:**

- Green toast notification: "Successfully initiated payment for 8 bills"
- Bill list now shows:
  - Status: "Initiated" (with clock icon)
  - All bills checked
  - Payment date column populated: "Jan 24, 2025" with "Arrives Jan 31, 2025" sub-text
  - Footer: "8 bills selected · $102,970.25 total"

**What we see:** `10-ramp-history-paid-status.jpeg` (1:30)

Switching to the "History" tab shows paid bills.

**UI observations:**

- Tab: **History** (active)
- Status filter: "Paid"
- Bill list showing:
  - Status: "Paid" (green checkmark)
  - "Imported · Jan 23, 2025" label preserved
  - Payment date: "Jan 24, 2025"
  - Actions: "Review" button
- Footer: "1-9 of 9 matching bills · $118,183.36 total"

**Narrated (1:23-1:30):**

> "And just like that all of our imported bills are set for payment."

**Takeaway:** Payment status is tracked in Ramp with full history. The "Imported" label persists across all bill states.

---

## 9. Bidirectional Sync: Status Returns to Xero (1:30-1:38)

**What we see:** `11-xero-synced-paid-bills.jpeg` (1:35)

Back in Xero, bills now show updated payment status.

**UI observations:**

- Xero "Bills" view, "Paid" tab (6 items)
- Same bills now show:
  - Paid date: "Jan 24, 2025"
  - All other metadata unchanged (Reference, Date, Paid amount)

**Narrated (1:30-1:38):**

> "Once bills are paid in Ramp they're automatically updated in your accounting system, keeping everything in sync without extra work."

**Takeaway:**

- **Bidirectional sync:** Bills import from Xero → paid in Ramp → status syncs back to Xero
- No manual reconciliation required
- Accounting system remains the source of truth

---

## 10. Settings Deep Dive: Account Mapping (0:23)

**What we see:** `12-xero-settings-checking-account.jpeg` (0:23)

A more detailed view of the Bill Pay settings showing account configuration.

**UI observations:**

- Bill Pay settings > Payments tab (active)
- Section: "Enabled accounts"
- Instruction: "Select bank accounts you plan to use to pay bills..."
- Sub-section: "Manual Accounts" (1 account enabled)
- Expanded card showing:
  - Account: "Checking (•••• 9752)"
  - Toggle: enabled
  - Details: "Autopay source · Savings Account $4,779,707.46"
  - Links: "Select Xero cash account (required)" → "Checking Account" selected
  - "Manage bank accounts" | "Manage accounting settings" links

**Takeaway:**

- Ramp bank accounts must be mapped to Xero cash accounts for proper reconciliation
- This mapping enables automated posting of payment transactions to the correct GL accounts in Xero

---

## What We Take Into the Build

### 1. External Bill Source Tracking (external_id + source)

**Pattern observed:** Every imported bill maintains:

- `external_id`: The Xero bill ID (visible in "Open in Xero" deep link, likely `bill-id=bb7aa9b3-c79e-4dcb-b62a-4483ae6d9778` pattern)
- `source`: The originating system ("Xero")
- Import timestamp: "Imported · Jan 23, 2025"
- Deep link back to source: "Open in Xero" with arrow icon

**Database implications:**

```typescript
interface Bill {
  external_id: string | null; // Xero bill UUID
  source: 'ramp' | 'xero' | 'qbo' | 'netsuite' | null;
  imported_at: Date | null;
  external_url: string | null; // Deep link to source
}
```

This enables:

- Audit trail of bill origin
- Preventing duplicate imports
- Bi-directional sync (status updates back to Xero)
- Deep linking for user context-switching

---

### 2. Bill Status Progression for Imported Bills

**Observed flow:**

1. Bill created in Xero (status: "Awaiting payment")
2. Synced to Ramp → lands in "For payment" tab (skips approval)
3. Status: "Unscheduled" (red badge)
4. User schedules payment → Status: "Initiated" (clock icon)
5. Payment processes → Status: "Paid" (green checkmark)
6. Status syncs back to Xero → "Paid" tab with payment date

**Key insight:** Imported bills bypass the "For approval" stage because they were already approved in the source system. This suggests:

```typescript
type BillStatus =
  | 'draft' // Created in Ramp, not submitted
  | 'pending_approval' // Submitted for approval in Ramp
  | 'approved' // Approved in Ramp
  | 'for_payment' // Ready to pay (could be approved OR imported)
  | 'scheduled' // Payment scheduled
  | 'processing' // Payment initiated
  | 'paid' // Payment completed
  | 'cancelled';

interface Bill {
  status: BillStatus;
  approval_bypassed: boolean; // true for imported bills
  approval_bypassed_reason?: 'imported_from_xero' | 'imported_from_qbo';
}
```

---

### 3. Import Sync Metadata & Controls

**UI elements observed:**

- Yellow banner: "Imported bills last updated Jan 24, 2025, 10:06 AM" with "Refresh" button
- Settings toggle: "Import bills from Xero" (enable/disable)
- Per-bill label: "Imported · Jan 23, 2025"

**Database implications:**

```typescript
interface AccountingIntegration {
  id: string;
  provider: 'xero' | 'quickbooks' | 'netsuite';
  enabled: boolean;
  bill_import_enabled: boolean;
  last_sync_at: Date;
  sync_status: 'success' | 'error' | 'in_progress';
}

interface Bill {
  sync_metadata?: {
    last_updated_in_source: Date;
    last_synced_from_source: Date;
    needs_refresh: boolean;
  };
}
```

This enables:

- Manual refresh trigger
- Stale data detection
- Sync status visibility

---

### 4. Account Mapping (Xero Cash Account ↔ Ramp Bank Account)

**Observed:** `12-xero-settings-checking-account.jpeg` shows:

- Ramp bank account: "Checking (•••• 9752)"
- Mapped to Xero cash account: "Checking Account"
- Balance display: "$4,779,707.46"

**Implication:** When a payment is made from a Ramp bank account, Ramp must:

1. Post the transaction to the corresponding Xero cash account
2. Reconcile the payment against the bill in Xero
3. Update bill status to "Paid"

**Database design:**

```typescript
interface BankAccount {
  id: string;
  ramp_account_id: string;
  external_cash_account_id?: string; // Xero account ID
  external_cash_account_name?: string; // "Checking Account"
  integration_id: string;
}
```

---

### 5. Imported Bill Metadata Mapping

**Xero fields → Ramp fields observed:**

- **Reference** (ABZ9, ABZ8...) → **Invoice number**
- **From** (Amazon Business) → **Vendor**
- **Date** (Jan 22, 2025) → **Invoice date**
- **Due date** (Feb 05, 2025) → **Due date**
- **Due amount** ($9,377.19) → **Bill total**

**Additional Xero fields likely imported (not shown in video but standard):**

- **Contact** (Xero vendor) → Mapped to Ramp vendor (by name or external_id)
- **Line items** with GL account codes → Expense categories
- **Tracking categories** → Custom fields / dimensions
- **Attachments** (invoice PDF) → Bill documents

**Database implications:**

```typescript
interface ImportedBillMetadata {
  external_reference: string; // "ABZ25"
  external_vendor_id: string; // Xero contact ID
  external_account_codes: string[]; // GL codes from line items
  external_tracking_categories?: Record<string, string>; // Xero dimensions
  external_attachments?: {
    file_id: string;
    file_name: string;
    url: string;
  }[];
}
```

---

### 6. Deep Linking Pattern

**Observed:** "Open in Xero" link with arrow icon

**Implementation pattern:**

```typescript
// Construct deep link to source record
function getExternalBillUrl(bill: Bill): string | null {
  if (!bill.external_id || !bill.source) return null;

  switch (bill.source) {
    case 'xero':
      return `https://go.xero.com/app/!!W6/bills/view/bill-id=${bill.external_id}`;
    case 'qbo':
      return `https://app.qbo.intuit.com/app/bill?txnId=${bill.external_id}`;
    case 'netsuite':
      return `https://[account].app.netsuite.com/app/accounting/transactions/vendbill.nl?id=${bill.external_id}`;
    default:
      return null;
  }
}
```

---

### 7. Import Label & Visual Distinction

**UI pattern observed:**

- Small text label under vendor: "Imported · Jan 23, 2025"
- Persists across all bill states (Unscheduled, Initiated, Paid)
- Icon indicators:
  - Document icon for imported bills (shown in vendor/owner column)
  - "Open in Xero" external link icon

**Component design:**

```tsx
<BillListItem>
  <VendorInfo>
    <Avatar>{vendor.initials}</Avatar>
    <div>
      <VendorName>{vendor.name}</VendorName>
      {bill.source && (
        <ImportLabel>
          <DocumentIcon />
          Imported · {formatDate(bill.imported_at)}
        </ImportLabel>
      )}
    </div>
  </VendorInfo>
</BillListItem>
```

---

### 8. Sync Status Banner (Freshness Indicator)

**Pattern:** "Imported bills last updated Jan 24, 2025, 10:06 AM" + Refresh button

**Use cases:**

- User can see when data was last synced
- Manual refresh trigger if data seems stale
- Error state if sync fails

**Implementation:**

```tsx
{
  integration.bill_import_enabled && (
    <SyncStatusBanner>
      Imported bills last updated {formatTimestamp(integration.last_sync_at)}
      <RefreshButton onClick={triggerSync} loading={syncing}>
        Refresh
      </RefreshButton>
    </SyncStatusBanner>
  );
}
```

---

### 9. Approval Bypass Logic

**Key insight:** Bills imported from Xero skip the "For approval" workflow stage.

**Business rule:**

- Bills created in Xero have already been approved in that system
- Ramp trusts the approval state from the source system
- Bills land directly in "For payment" status

**Code implication:**

```typescript
async function importBillFromXero(xeroBill: XeroBill) {
  const bill = await createBill({
    source: 'xero',
    external_id: xeroBill.id,
    status: 'for_payment', // Skip approval
    approval_bypassed: true,
    approval_bypassed_reason: 'imported_from_xero',
    // ... other fields
  });

  // Do NOT trigger approval workflow
  // Do NOT notify approvers

  return bill;
}
```

---

### 10. Bidirectional Sync: Payment Status Writeback

**Observed flow:**

1. Bill imported from Xero with status "Awaiting payment"
2. Paid in Ramp → status changes to "Paid"
3. Ramp writes back to Xero:
   - Bill status → "Paid"
   - Payment date → "Jan 24, 2025"
   - Payment account → Checking (mapped account)

**API design:**

```typescript
async function syncPaymentToXero(payment: Payment) {
  const bill = await getBill(payment.bill_id);
  if (bill.source !== 'xero' || !bill.external_id) return;

  await xeroClient.updateBill(bill.external_id, {
    status: 'PAID',
    paid_date: payment.payment_date,
    payment_account_id: getMappedXeroAccount(payment.bank_account_id),
    payment_amount: payment.amount,
  });

  await updateBill(bill.id, {
    'sync_metadata.last_synced_to_source': new Date(),
  });
}
```

---

### 11. Settings: Integration Toggle Hierarchy

**Observed structure:**

- Bill Pay settings tabs: Payments, Permissions, Approvals, Accounting, **Importing**
- Under Importing:
  - "Pay bills from Xero on Ramp" section
  - Toggle: "Import bills from Xero"
  - Link: "Learn more about importing bills"

**Settings data model:**

```typescript
interface BillPaySettings {
  integrations: {
    xero?: {
      enabled: boolean;
      bill_import_enabled: boolean;
      payment_sync_enabled: boolean;
      account_mappings: {
        ramp_bank_account_id: string;
        xero_cash_account_id: string;
      }[];
    };
    quickbooks?: { /* similar */ };
  };
}
```

---

## Summary: Key Patterns for Our Build

1. **External provenance tracking** via `external_id` + `source` + `imported_at`
2. **Approval bypass** for imported bills (already approved upstream)
3. **Deep linking** back to source system ("Open in Xero")
4. **Sync status visibility** with timestamp and manual refresh
5. **Account mapping** (Ramp bank account ↔ Xero cash account)
6. **Bidirectional sync** (import → payment → writeback)
7. **Visual distinction** (import label, icon, persistent across states)
8. **Metadata preservation** (invoice number, dates, vendor)
9. **Batch intelligence** works across imported and native bills
10. **Settings hierarchy** (per-integration toggle + account mappings)

These patterns directly validate our database schema decisions around `external_id`, `source`, and the integration seam design.
