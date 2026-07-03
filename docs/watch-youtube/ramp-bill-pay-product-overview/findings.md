# Ramp Bill Pay Product Overview - UI/UX Findings

**Source:** [https://www.youtube.com/watch?v=6Yp_FpNY4Qc](https://www.youtube.com/watch?v=6Yp_FpNY4Qc)
**Duration:** 228 seconds (3:48)
**Captured:** 2026-07-03
**Artifacts:** [snapshots/](./snapshots/) | [captions.vtt](./captions.vtt)

## Overview

This video demonstrates Ramp's Bill Pay product, positioning it as an "agentic AP platform" that uses AI to automate invoice processing. The demo walks through the complete bill lifecycle: ingestion, coding, approval, and payment.

---

## 1. Dashboard & Navigation

**Frames:** `01-dashboard-drafts-tab.jpeg`

### Tab Structure
The Bill Pay interface uses a horizontal tab navigation organizing bills by lifecycle stage:
- **Overview** - All bills aggregate view
- **Drafts** - Bills in draft state
- **For approval** - Bills awaiting approval
- **For payment** - Approved bills ready to pay
- **History** - Completed/archived bills

**Additional UI element:** A custom "bills due this month" filter/view appears to the right of the tabs.

### Table Columns
The drafts table displays:
- Checkbox for bulk selection
- **Vendor/submitter** - Vendor name with avatar/logo, submitter name, and date
- **Status** - Pill-style status badges (Missing info, Ready for review, Queued)
- **Amount** - Right-aligned currency
- **Payment method** - Icon + text (ACH, Manual payment, or blank)
- **Due date** - Standard date format
- **Actions** - "Review" button + overflow menu (three dots)

### Toolbar Controls
- **Search or add filter...** - Search bar with filter dropdown
- **Status filter chips** - Quick filters: "Missing info", "Ready for review", "Queued"
- **View toggles** - Card view, table view, calendar view icons
- **Download** icon
- **Options** dropdown

**Bottom status bar:** Shows pagination "1-21 of 21 drafts" and total amount "$494,520.80 total + 5 more currencies"

**Timestamp reference:** 0:19-0:24 in narration describes navigation by stages.

---

## 2. Fraud & Duplicate Detection

**Frames:** `02-fraud-duplicate-warnings.jpeg`, `03-bill-detail-drawer-fraud-alert.jpeg`

### Warning Banners
Ramp displays inline yellow warning banners directly in the table:

1. **Fraud warning (Action Inc):**
   - "This bill might be fraudulent. We don't recognize the vendor. View bill"
   - Yellow background, warning icon, clickable link

2. **Duplicate warning (WB Mason):**
   - "This draft may be a duplicate of INV# 8960. Make sure you're not paying twice."
   - Yellow/beige background, clickable invoice reference

### Fraud Detail Screen
When viewing a flagged bill (`03-bill-detail-drawer-fraud-alert.jpeg`), the system displays:
- Large yellow alert box: "Make sure this invoice is legitimate"
- Warning text: "We weren't able to verify your vendor's information..."
- Call-to-action: "Contact your vendor to make sure the invoice is coming from them."

**Timestamp reference:** 0:42-0:56 narrates fraud checks using "series of different identifiers."

---

## 3. Invoice Ingestion Methods

**Frames:** `04-drag-drop-upload.jpeg`, `18-new-bill-menu-ingestion-options.jpeg`

### Drag-and-Drop Upload
Full-screen drop zone appears with:
- Upload icon
- Text: "Drop multiple invoices here to bulk upload them!"
- Visual indicator showing file being dragged (blue badge: "ACME Inc. INV-202...S2...pdf")

### New Bill Menu (`18-new-bill-menu-ingestion-options.jpeg`)
Clicking "New bill" dropdown reveals multiple ingestion methods:

1. **Forward invoices to Ramp** (Recommended badge)
   - Description: "Forward invoices and Ramp will automatically create drafts with pre-filled information for your review. Learn more"
   - Shows unique email addresses per entity/division

2. **Select or drag-and-drop invoices to upload** - Manual file upload

3. **Create bills via spreadsheet** - Bulk import from CSV/Excel

4. **Create bill without an invoice** - Manual entry

**Timestamp reference:** 0:58-1:07 describes "AP inbox, integrate an import directly from your accounting provider, or simply drag and drop."

---

## 4. Bill Detail Drawer - Vendor Section

**Frames:** `05-invoice-preview-vendor-section.jpeg`, `06-vendor-actions-menu.jpeg`

### Layout
The bill detail view uses a side-by-side layout:
- **Left pane:** PDF/image of the invoice (zoomable)
- **Right pane:** Structured bill data with tabs (Invoice, Documents, Overview, Activity)

### Vendor Section
Under the "Vendor" heading:
- Vendor avatar/logo (circular)
- **Vendor name** (ACME)
- Last paid amount and date: "Last paid $87,750.00 on Sep 12, 2025"
- **"See past bills"** link with chevron
- **Overflow menu** (three dots) revealing:
  - Change vendor
  - Edit vendor details
  - View vendor

### Bill Details Fields
- **Create bill under:** Dropdown showing entity (Bill Pay Inc.)
- **Invoice #**
- **Invoice date** and **Due date** (with date pickers)
- **Accounting date** with "Change" link
- **Description** - Free text field
- **Matching purchase order** - Dropdown (optional)

**Timestamp reference:** 1:19-1:28 describes vendor management "built directly into the AP flow."

---

## 5. Line Item Autocoding

**Frames:** `07-line-items-autocoded.jpeg`, `08-drawing-mode-highlight-coding.jpeg`, `09-add-context-modal.jpeg`

### Line Items Table
The "Line items" section displays:
- Header: "Line items" with "Change currency" link
- **Smart action:** "Ramp can simplify these into a single line item" with "Collapse line items" button

Each line item shows:
- **Line number** (01, 02, etc.)
- **Description** (e.g., "Office Chairs")
- **Amount** (right-aligned: $12,000.00)
- **Overflow menu** (three dots)

### Autocoded Fields
Below each line item, the system displays pre-filled accounting codes:
- **NetSuite Category** dropdown: "6300 - Office Su..."
- **NetSuite Location** dropdown: "7 - Boston" with "Coded by Ramp" badge
- **NetSuite Department** dropdown: "1 - Admin"
- **NetSuite Classification** dropdown: "1 - Hardware"
- **NetSuite Custom...** dropdown
- **NetSuite Billable** dropdown

Checkbox: "Save as default coding for future bills"

**Timestamp reference:** 1:34-1:40 shows "Autocoding your different accounting categories line by line."

### Drawing Mode for Coding Updates (`08-drawing-mode-highlight-coding.jpeg`)

The system allows users to select regions of the invoice PDF to update coding:
- **"Exit drawing mode"** button appears when active
- User highlights a specific field on the invoice (e.g., "Bill To" address showing "28 W 23rd St, New York, NY 10010")
- This triggers the "Add context" modal

### Add Context Modal (`09-add-context-modal.jpeg`)

Modal appears with:
- **Title:** "Add context"
- **Description:** "Highlight details from the invoice to help us automatically code better"
- **Prompt:** "What is the correct value in this case?"
- **Dropdown:** Pre-filled with extracted value (e.g., "NetSuite Location: 6 - New York City")
- **Optional notes field:** "Optionally tell us why this value is correct" with free-text input
- **Buttons:** Cancel, Apply, "Save & apply" (highlighted in yellow)

**Timestamp reference:** 1:57-2:09 explains highlighting invoice areas to "apply coding updates" and that "Ramp will remember and use this added context to adjust coding for future invoices."

---

## 6. Payment Methods & Details

**Frames:** `10-payment-details-ach.jpeg`, `11-payment-account-picker.jpeg`, `12-pay-by-card-options.jpeg`, `13-virtual-card-details-approvers.jpeg`

### Payment Details Section

The "Payment details" section offers multiple payment methods via dropdown:

**ACH (Direct deposit)** - Default view (`10-payment-details-ach.jpeg`):
- **Pay from account** dropdown - Selects source account (e.g., "Checking (...9752)")
- **Send payment to** dropdown - Selects vendor account (e.g., "Bank of America (...0000)")
- **Payment schedule** - Toggle: "Schedule now" / "Schedule later"
  - **Payment date** picker
  - **Business days indicator:** "2 business days" with arrow to **Arrival date**

**Account Picker** (`11-payment-account-picker.jpeg`):
When clicking the account dropdown, options include:
- **Checking (...9752)** - USD Savings Account with balance $4,779,707.46 (with checkmark, currently selected)
- **Business Account** - USD with balance $170,575.82 (highlighted in yellow, labeled "REBATE")
- Footer text: "Free same-day ACH and wires - Bill Pay Inc."

**Card Payment Options** (`12-pay-by-card-options.jpeg`):
Selecting "Pay with Ramp Card" reveals:
- **New card** / **Existing card** tabs
- Three card delivery options with icons:
  1. **Pay automatically** (selected, checkmark) - "We'll charge a single-use virtual card in ACME's portal on the due date. This card allows charges only up to the bill's total and locks after use."
  2. **Send card to vendor** - Envelope icon
  3. **Use card myself** - Card icon
- **Memo for vendor** - Text field with pre-filled memo

**Cashback Banner:**
- Prominent callout: "Earn up to $87,750 cashback without the swipe"
- Subtext: "We'll charge your Ramp Card automatically in ACME's portal on the due date"
- "Pay with Ramp Card" button + "Learn more" link

### Virtual Card Creation (`13-virtual-card-details-approvers.jpeg`)

When creating a virtual card:
- **Card details preview:**
  - "Virtual INV# 2025-00125 from ACME"
  - **Name on card:** "Visible after approval"
  - **Billing address:** "123 Main St, New York City, NY, US 10003"
  - Amount: "$87,750.00 / Total"

- **Create bill under:** Entity dropdown
- **Send for review to:** User avatars showing approvers (Vendor Owner, Any Admin)
- **"Approve bill"** checkbox option (allows self-approval)

**Timestamp reference:** 2:15-2:41 narrates payment options: "ACH, domestic or international wire, check, or pay by card" and virtual card creation with cashback earning potential.

---

## 7. Approval Workflow & AI Recommendations

**Frames:** `14-approval-review-recommended.jpeg`, `15-approval-ready-to-approve.jpeg`

### Review Recommended State (`14-approval-review-recommended.jpeg`)

The approval view displays a large yellow callout box labeled "Review recommended" (Beta):
- **Summary:** "We found issues on this $87,750.00 bill for ACME"
- **Warning icon items:**
  - "Payment method changed from CARD to ACH, even though bill amounts aligned"
  - "Invoice number 'INV-00012000' has too many digits. Similar bills use fewer digits."

**Checks passed** (with green checkmarks):
- "Accounting coding for bill and line items aligns with previous similar bills"
- "Entity (Bill Pay Inc.) matches most recent bill"
- "Payment is scheduled to arrive on time"

**"Show less"** link to collapse details

**Action buttons:**
- **Edit** (secondary)
- **Reject** (secondary, red outline)
- **Approve & schedule** (primary, green)

**Status:** "Awaiting approvals..."

**Timestamp reference:** 3:01-3:06 describes how "Ramp will even provide a recommendation on bills that need your review."

### Ready to Approve State (`15-approval-ready-to-approve.jpeg`)

Alternative approval state displays:
- Green callout: "Ready to approve" (Beta)
- **Summary:** "This $150,042.75 bill for Figma passed all automated checks"

**Checks passed** (4 items with green checkmarks):
- "Accounting coding for this bill and line items aligns with previous similar bills"
- "Bill amount aligns with similar bills for Figma"
- "Entity (Bill Pay Inc.) matches most recent bill"
- "Payment is scheduled to arrive on time"

**Timestamp reference:** 3:08-3:11 mentions "bills that Ramp deems ready to approve."

---

## 8. Bulk Payment & Release

**Frames:** `16-for-payment-tab.jpeg`, `17-bulk-payment-review.jpeg`

### For Payment Tab (`16-for-payment-tab.jpeg`)

The "For payment" tab shows approved bills ready for release:
- Filter chips: "Ready for release", "Scheduled", "Initiated"
- All rows have checkboxes for bulk selection
- **Status indicators:**
  - "Ready for release" (orange dot icon)
  - "Payment details needed" (warning icon)

**Bottom selection bar:**
- "31 bills selected"
- "$14,293,124.54 total"
- **Edit** dropdown
- **"Review payments"** button (yellow, shows count: "30")

### Bulk Payment Review Modal (`17-bulk-payment-review.jpeg`)

The review modal displays:
- **Title:** "Review payments"
- **Total amount:** "$855,258.42" (large display)
- **Schedule selector:** "Today" dropdown with estimated arrival "Oct 8 - 15, 2025"
- **Payment source:** "Paid from Checking - Manual account (...9752), bills due this month"

**Grouped by vendor:**
Each vendor shows:
- Vendor avatar + name
- Bill count and payment method (e.g., "0/3 bills • ACH (Direct deposit) • Bank of America (...0000)")
- Total amount
- Status badge: "Batched" (gray)

Example entries:
- Amazon - $748,988.58
- Docusign - $3,269.84
- Staples - $0.00 (0/2 bills, Check by mail)
- Salesforce - $0.00 (0/9 bills, Check by mail)

**Additional vendors collapsed under "Mutiny..."**

**Action buttons:**
- **Cancel** (secondary)
- **"Release payments"** (primary, yellow)

**Timestamp reference:** 3:23-3:34 describes bulk payment: "Simply select and review your payments before they go out the door. Bills are batched by vendor, making it clear what bills you are paying and to whom."

---

## What We Take Into the Build

### Must-Have Features

1. **Tab-based lifecycle navigation** - Organize bills by Draft → Approval → Payment → History stages
2. **Inline fraud/duplicate warnings** - Yellow banners directly in the table with contextual messaging
3. **Multi-channel ingestion** - Support email forwarding, drag-drop, spreadsheet import, and manual entry
4. **Bill detail drawer** - Side-by-side invoice preview with structured data entry
5. **Line-item level coding** - Each line gets its own GL codes with visual separation
6. **Drawing mode for invoice annotation** - Allow users to highlight invoice regions to correct/teach the system
7. **Payment method flexibility** - ACH, check, and card options with account selection
8. **Approval recommendations** - Surface AI-driven "review recommended" vs "ready to approve" with specific check results
9. **Bulk payment batching** - Group by vendor, show totals, allow batch release

### Novel UI Patterns

1. **"Coded by Ramp" badges** - Small pills next to auto-filled fields to indicate AI-generated values
2. **"Save as default coding" checkbox** - Immediate feedback loop to improve future autocoding
3. **Add context modal** - Structured way to teach the system from invoice highlights
4. **Cashback call-to-action in payment flow** - Prominently surfaces card payment benefits during payment selection
5. **Virtual card preview** - Shows what the generated card will look like before creation
6. **Checks passed/failed sections** - Collapsible lists of specific approval criteria with icons
7. **Vendor-batched payment review** - Groups bills by payee in final confirmation step

### Design System Elements

- **Status pills** - Rounded badges with dot icons (Missing info, Ready for review, etc.)
- **Yellow highlight color** - Used for warnings, primary actions, and recommendations
- **Split-pane layout** - Document viewer left, form right
- **Overflow menus** - Three-dot menus for secondary actions
- **Icon + text combinations** - Payment methods shown as icon+label pairs
- **Progress bars** - Gray bars showing completion percentage
- **Avatar lists** - User/vendor avatars in circular badges
- **Dropdown selectors** - Consistent dropdown styling for all pickers
- **Date pickers** - Calendar icon triggers modal date selection
- **Smart action chips** - Contextual suggestions like "Ramp can simplify these into a single line item"

### Interaction Patterns

- **Drawing mode toggle** - Explicit entry/exit of annotation state
- **Highlight → modal workflow** - Select region → see modal → confirm → save
- **Multi-select with bulk actions** - Checkbox column + bottom action bar
- **Expandable warning sections** - "Show less" / "Show more" for detailed checks
- **Toast/banner notifications** - "Created draft" appears after successful actions
- **Tab persistence** - Tabs remember filter/sort state

### Accessibility & UX Considerations

- **Explicit status indicators** - Color + icon + text for all states
- **Contextual help text** - Gray descriptive text below key actions
- **Confirmation modals** - All bulk actions require review step
- **Entity selection** - Clear indication which legal entity bills are under
- **Payment timeline visualization** - "2 business days" with arrow to arrival date
- **Vendor history links** - Quick access to past bills from detail view

---

## Summary

Ramp's Bill Pay product demonstrates a sophisticated AP automation platform with strong AI integration. The UI emphasizes transparency (showing what the system autocoded vs. user-entered), feedback loops (teaching the system via annotations), and risk mitigation (fraud checks, duplicate detection, approval recommendations). The three-column layout pattern (list → detail → form) and lifecycle-based tab structure provide clear information architecture. The bulk payment review flow is particularly well-designed, grouping by vendor and showing clear totals before release.

For our payables product, we should prioritize the drawing mode annotation feature, the approval recommendation engine, and the vendor-batched payment review flow as differentiators beyond basic bill pay functionality.
