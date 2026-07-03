# Ramp Accounting Series: Bill Pay UCSV Export

**Source:** [YouTube Video](https://www.youtube.com/watch?v=XcGysi9MuPk)
**Duration:** ~66 seconds
**Captured:** 2026-07-03
**Snapshots:** [./snapshots](./snapshots)

---

## Overview

This video demonstrates Ramp's Universal CSV (UCSV) export feature for Bill Pay, designed for customers who need to upload bill and payment data to their ERP systems. The feature exports bills, payments, and associated vendor data in a customizable CSV format.

---

## Navigation & Entry Point

**SAW (0:11-0:17):** The Bill Pay export functionality lives within a dedicated accounting workflow:
- **Primary Navigation:** Accounting tab (top-level navigation)
- **Secondary Navigation:** Bill Pay subtab (under Accounting)
- **View:** Table showing bills and payments with Status, Expense/Payment columns, amounts, dates
- **Screenshot:** `01-accounting-billpay-table.jpeg`

The Bill Pay view provides an overview of both bill expenses and payments in a unified table interface.

---

## Export Trigger

**SAW (0:22-0:25):** Export is initiated through a prominent action in the top-right toolbar:
- **Location:** "Export all" button in page header (lime green/yellow accent color)
- **Context:** User can select individual bills or use "Select all" to choose all bills
- **Selection State:** Selected bills show checkmarks in leftmost column; bottom toast shows count ("7 bills selected - $89,177.43 total")
- **Screenshot:** `02-bills-selected-export-button.jpeg`

**NARRATED:** "Let's select all and prepare to export. From here we can jump into CSV export settings."

The export button is consistently visible and does not require opening a dropdown or options menu.

---

## Review & Export Modal

**SAW (0:25-0:30):** Clicking "Export all" opens a "Review & export" modal with preview and customization:
- **Modal Title:** "Review & export"
- **Header Text:** "Bills and payments will be exported as two distinct CSVs. Edit your export formats here. Any newly paid vendors will be exported as a CSV as well."
- **Info Banner:** Blue info box stating "Improved Bill Pay exports - Bills and payments are now exported as separate files"
- **Action:** "Customize exports" link (top right of info banner)
- **Collapsible Sections:**
  - "Bills that will be exported" (7 items)
  - "Payments that will be exported" (4 items)
  - "Vendors that will be exported" (9 items)
- **Footer Actions:**
  - "Export as" dropdown (allows format selection)
  - "Export CSV" button (lime green/yellow, primary action)
- **Screenshots:** `03-review-export-modal.jpeg`, `04-customize-exports-link.jpeg`

**NARRATED:** "From here we can jump into CSV export settings and dictate how we would like our CSV files to look."

---

## CSV Export Settings

**SAW (0:28-0:38):** Clicking "Customize exports" opens dedicated CSV Export Settings modal:

### Settings Modal Structure
- **Modal Title:** "CSV Export Settings"
- **Back Navigation:** "← Back" link (returns to Review & export)
- **Tabs:** Three tabs for different export types:
  - Card transactions
  - Bill expense (active in demo)
  - Bill payment
- **Info Banner:** "Export bills and payments separately - Bills and payments are now exported as separate files. Use the 'Bill Expense' and 'Bill Payment' tabs above to customize your export settings for each."
- **Screenshots:** `05-csv-export-settings-bill-expense.jpeg`, `06-csv-export-settings-bill-payment.jpeg`

### Universal CSV (UCSV) Configuration
**SAW + NARRATED (0:30-0:38):** "Bills and payments are exported separately and can have their own CSV template."

- **Section 1: Set up your CSV**
  - Description: "Set up your CSV manually or upload a past CSV and let Ramp do the work for you"
  - Dropdown: "Set up preference - Upload previous CSV" (can also set up manually)

- **Section 2: Upload a past CSV**
  - Description: "Let Ramp do the hard work for you. Upload a CSV that you've used in the past, and we'll format your Ramp CSV export based on that file."
  - Upload Area: Dashed border box with "Drop file or click here to upload" prompt
  - Actions: "Cancel" and "Save" (lime green) buttons

**Key Concept:** The "Universal CSV" approach allows customers to upload their existing ERP CSV format, and Ramp will automatically map its export to match that format. This eliminates manual column mapping for each export.

---

## Export Preview

**SAW (0:41-0:50):** The Review & export modal shows expandable previews of what will be exported:

### Bills Preview
- **Columns Shown:**
  - Vendor (e.g., HubSpot, Cybertec International, Deckhand, Bold Tech, Nightfall, Mutiny, Amazon)
  - Category (e.g., "1100 Salaries and Wages", "3100 Legal and Consulting Fees", "6100 Software Subscription", "6300 Office Supplies")
  - Amount (e.g., $2,000.00, $2,640.00, $18,500.00, $7,567.50, $6,000.00, $51,500.00, $969.93)
  - Payment Date (e.g., "Mar 14, 2024", "—" for unpaid)
- **Screenshot:** `07-bills-preview-export.jpeg`

### Payments Preview
- **Columns Shown:**
  - Vendor (e.g., Cybertec International, Deckhand, Bold Tech, Nightfall)
  - Category (same as bills)
  - Amount (matches paid bill amounts)
  - Payment Date
- **Screenshot:** `08-payments-vendors-preview.jpeg`

### Vendors Preview
- **List Shown:** Simple vendor name list (9 vendors total including Amazon, Bold Tech, Cybertec International, Deckhand, HubSpot, Mutiny, Nightfall, Salesforce, Test Vendor - marketing)

**NARRATED (0:41-0:50):** "Furthermore Ramp offers a preview of both bills being exported, payments that will be exported, and all associated vendors."

---

## Exported CSV File Structure

**SAW (0:52-1:01):** After clicking "Export CSV", the resulting file opens showing the actual CSV structure:

### Bills CSV Columns (visible in export)
- Bill Id
- Vendor ID
- Invoice Number
- Status (UNPAID, PAID)
- Vendor (vendor name)
- Payment ID
- Vendor ID (duplicate column?)
- Invoice Number (duplicate?)
- Bill Date (e.g., "2022-12-31", "2024-03-13")
- Bill Due Date (e.g., "2025-01-30", "2024-03-13")
- Payment Date (e.g., "2025-01-23", "2024-03-20")
- Payment Type (ACH, CHECK, INTERNATIONAL, PAID_MANUALLY)
- Bill Link (URL to Ramp bill detail page)
- Payment Amount
- Account Name (e.g., "2000 Accounts Payable")
- Additional columns visible but cut off in screenshot

**Screenshot:** `09-exported-csv-columns.jpeg`

### Payments CSV
**NARRATED (0:56-1:01):** "Ramp will download two separate CSV files: one for expenses, the other for payments."

The Payments CSV appears as a separate sheet/file with columns:
- Vendor
- Vendor ID
- Invoice Number
- Payment ID
- Payment Date
- Payment Type (ACH, CHECK, INTERNATIONAL)
- Bill Link
- Payment Amount
- Account Name (e.g., "2000 Accounts Payable")

---

## Key Observations

### Export Scope & Filtering
- **SAW:** The export operates on selected bills from the Bill Pay table
- **SAW:** Selection includes a total count and dollar amount shown in bottom toast
- **No explicit date range filter shown in this demo**, but the table likely supports filtering before export

### Separate Bills vs. Payments Exports
- **SAW + NARRATED:** Bills and payments are always exported as two distinct CSV files
- **SAW:** Each can have its own customized CSV template (via the tabbed settings)
- **SAW:** Vendors associated with the selected bills/payments are also exported as a third CSV

### Universal CSV Concept
- **SAW:** Users can upload a "past CSV" (their existing ERP format)
- **SAW:** Ramp will then format future exports to match that uploaded template
- **Benefit:** Eliminates need for manual column mapping or reformatting for ERP import

### Export Action Location
- **SAW:** "Export all" button is prominently placed in page header (not buried in a menu)
- **SAW:** "Customize exports" is accessible via link in the export modal (not primary flow)
- **Pattern:** Quick export for regular use; settings available when customization is needed

### Preview Before Export
- **SAW:** The "Review & export" modal shows exactly what will be exported
- **SAW:** Three collapsible sections for Bills, Payments, and Vendors
- **SAW:** Preview shows key columns (Vendor, Category, Amount, Payment Date) for verification

### Multi-Entity Export
- **SAW:** Not just bills — also exports payments and vendors in separate files
- **SAW:** Vendors list appears to include all vendors associated with the selected bills/payments
- **Use Case:** Ensures vendor master data is available for ERP systems that need it

---

## What We Take Into the Build

For a Bill Pay clone CSV export feature, implement these patterns:

1. **Prominent Export Button:** Place "Export" or "Export all" as a primary action in the Bills table toolbar (not hidden in overflow menu). Use accent color (lime green) for visibility.

2. **Selection-Based Export:** Export operates on selected bills. Show selection count and total amount in a bottom toast/banner.

3. **Review Modal Before Export:** Open a "Review & export" modal that shows:
   - Summary of what will be exported (bills, payments, vendors counts)
   - Expandable previews of each export section with key columns
   - "Customize exports" link for settings access
   - Final "Export CSV" action button

4. **Separate CSV Files:** Generate multiple CSV files in a single export:
   - Bills CSV (bill metadata, amounts, dates, categories)
   - Payments CSV (payment-specific data: payment type, payment date, payment amount)
   - Vendors CSV (vendor master list associated with exported bills)

5. **Customizable CSV Templates:** Provide CSV Export Settings accessible via "Customize exports":
   - Tabbed interface for different export types (Bills, Payments)
   - Option to upload user's existing CSV format
   - System auto-maps Ramp data to match uploaded format (UCSV concept)
   - Store template per export type so future exports use same format

6. **Rich CSV Columns:** Include comprehensive data in CSV exports:
   - Bill IDs, Vendor IDs, Invoice Numbers
   - Dates: Bill Date, Due Date, Payment Date
   - Amounts and Categories (GL codes)
   - Status (Paid/Unpaid)
   - Payment Type (ACH, Check, International, Manual)
   - Deep links back to bill detail pages in the app

7. **Multi-File Download:** When user clicks "Export CSV", download 2-3 CSV files (bills, payments, vendors) — likely as a ZIP or sequential downloads.

8. **Info Banners for New Features:** Use blue info banners in modals to communicate feature improvements (e.g., "Bills and payments now exported separately").

9. **Settings Persistence:** CSV export settings (uploaded templates) should persist so users don't reconfigure each time.

10. **ERP Integration Focus:** Frame the feature as "export for upload to your ERP" — emphasize QuickBooks, Xero, Sage, NetSuite compatibility through the Universal CSV approach.
