# Ramp Bill Pay Series: 1099's

**Source:** https://www.youtube.com/watch?v=2x_SZ8QcttE
**Duration:** 117 seconds
**Summary:** Comprehensive walkthrough of Ramp's 1099 tax reporting workflow, from vendor eligibility tracking through W-9 collection, box mappings, and IRS e-filing.

**Resources:**

- [Full captions (VTT)](./captions.vtt)
- [Snapshots](./snapshots/)

---

## Overview

This video demonstrates Ramp's end-to-end 1099 filing automation, showing how the platform handles year-end tax reporting for vendors who meet 1099 thresholds. The narrator walks through the dedicated 1099 dashboard accessible from the Vendors tab, explaining workflow states, W-9 collection, AI-powered box mappings, and the final filing process with IRS and state agencies.

---

## UI/UX Walkthrough

### 1. Entry Point: Vendors Tab → "Review 1099 vendors" (0:24–0:26)

**SAW:** The main Vendors page shows a vendor table with columns: Vendor name, Owners, 365-day spend, 30-day spend, Vendor owner location, Department. In the top-right corner, next to "New vendor" (yellow CTA), there's a "Review 1099 vendors" button.

**Narrated:** "In the vendors tab, click review 1099 vendors."

**Snapshot:** `01-vendors-overview-tab.jpeg`

**Significance:** The 1099 feature is surfaced as a top-level action alongside vendor creation, indicating its importance. This is the primary entry point for year-end tax preparation.

---

### 2. 1099 Dashboard: Multi-Tab Layout (0:30–0:40)

**SAW:** A full-page drawer opens titled "1099 vendors for [Company Name]" with a company dropdown. The interface has five tabs:

- **Overview** (active)
- **Needs review** (badge: 2)
- **Ready to file** (badge: 3)
- **Completed**
- **Excluded vendors**

A blue info banner at the top states: "We recommend mapping 3 Accounting Categories to 1099 boxes" with a "Review suggestions" button.

The table below has filter toggles (Meets reporting threshold: Yes, 1099-eligible vendor: Yes) and columns: Vendor, Status, Total uncategorized, 1099-NEC total, 1099-MISC total, 1099 box, Default contact, Actions.

Each vendor row shows:

- Status badge (e.g., "Ready to file", "Missing tax details")
- Dollar amounts for NEC/MISC totals
- Box assignment (e.g., "Nonemployee compensation - Box 1", "Multiple")
- Contact email
- "File 1099" button or "Request tax details" link

**Narrated:** "As your vendors become 1099 eligible throughout the year, they populate in your 1099 dashboard. Here you can see a complete view of vendors that need review, those that are ready to file, completed, as well as any excluded vendors."

**Snapshot:** `02-1099-dashboard-overview.jpeg`

**Significance:**

- Clear progressive disclosure: vendors move through a staged workflow.
- Real-time tracking: vendors auto-populate when they cross reporting thresholds.
- Data transparency: totals are broken out by form type (NEC vs. MISC) and box.
- AI suggestion: the platform proactively recommends category-to-box mappings.

---

### 3. Excluded Vendors Tab (0:43)

**SAW:** Switching to the "Excluded vendors" tab shows a similar table with vendors marked "Not 1099-eligible" (orange badge). Columns include: Vendor, Status, Default contact, Tax address, Tax classification, Actions. Each row has a "1099-eligible" action button to toggle the vendor back in.

**Narrated:** (Cursor hovers over "Excluded vendors" tab.)

**Snapshot:** `03-excluded-vendors-tab.jpeg`

**Significance:** Users can explicitly exclude vendors from 1099 reporting (e.g., corporations, non-US entities). This prevents accidental over-reporting.

---

### 4. Needs Review Tab: Bulk W-9 Request (0:45–0:50)

**SAW:** The "Needs review" tab is active. Two vendors with "Missing tax details" status are checked. A bottom sheet appears: "2 vendors selected" with a yellow "Request tax details" button.

**Narrated:** "Moving to the needs review tab. Here we can take bulk action and request W9 and e-consent from necessary vendors."

**Snapshot:** `04-needs-review-tab-bulk-action.jpeg`

**Significance:**

- Bulk operations: users can select multiple vendors and request W-9 forms + e-consent in one action.
- Status-driven workflow: "Missing tax details" is a blocker state that triggers the request flow.

---

### 5. AI-Suggested Mappings Modal (0:56–1:08)

**SAW:** A modal titled "Review suggested 1099 mappings" appears. Subtitle: "We matched 3 Accounting Categories to their 1099 boxes." The modal shows:

**Form 1099-MISC**

- **Box 1 - Rents**
  Tag: "Rent & Lease Expense" (removable)
- **Box 10 - Gross proceeds paid to an attorney**
  Tags: "Interest Income & Interest Accrued", "Legal & Consulting Fees" (both removable)

Buttons: "Skip" (ghost) and "Confirm" (yellow primary).

**Narrated:** "Once this is complete, I can start my box mappings to generate all 1099 forms in just a few clicks. RAMP AI will recommend mapping spend attributed to your accounting categories to specific boxes."

**Snapshot:** `05-ai-mappings-modal.jpeg`

**Significance:**

- AI-powered intelligence: Ramp automatically maps GL categories to 1099 boxes based on IRS rules.
- User control: mappings are presented as suggestions, not auto-applied.
- Efficiency: reduces manual classification work.

---

### 6. Vendor Detail: Tax Details Section (1:15)

**SAW:** Clicking into a vendor (e.g., "Brookside Research Group") opens a right-side drawer. The "Tax details" section (marked "Complete" in green) shows:

- **Vendor legal name:** Brookside Research Group
- **Federal tax classification:** Partnership
- **Taxpayer Identification Number (TIN):** ••••••• (masked, with lock icon)
- **E-consent for tax documents:** Request e-delivery consent (link)
- **1099 status (2024):** No
- **1099 status (2025):** Yes
- **Address:** Brookside Research Group, 905 Brookside Lane, Madison, WI 53711

Footer: "Tax details verified by Ramp" with checkmark badge.

Below, a collapsible "Bill line items" section (marked "Ready to file") shows the vendor's total spend for 2025.

**Narrated:** (Clicking into vendor detail.)

**Snapshot:** `06-vendor-tax-details-drawer.jpeg`

**Significance:**

- Comprehensive tax profile: legal name, TIN, classification, address all in one place.
- Multi-year tracking: separate 1099 status fields for each tax year.
- TIN verification: Ramp validates TINs (likely via IRS TIN Matching).
- E-consent management: built-in flow to request digital delivery permission.

---

### 7. Box Mapping: Per-Vendor Customization (1:08–1:15)

**SAW:** In the vendor drawer, under "Bill line items," each line shows:

- Invoice number + description
- 1099 box dropdown (e.g., "Nonemployee compensation - Box 1" with lightning bolt icon)
- Amount

A dropdown is open, showing box options:

- Search field
- **1099-NEC**
  - Nonemployee compensation - Box 1 (selected, checkmark)
- **1099-MISC**
  - Rents - Box 1
  - Royalties - Box 2
  - Other income - Box 3
  - Federal income tax withheld - Box 4
  - Fishing boat proceeds - Box 5
  - (list continues)
- **Not reportable**

At the bottom: "+ Add additional spend" link.

**Narrated:** "You also have full power to customize and edit the vendor mappings however you would like, from bill level line items all the way down through additional spend."

**Snapshots:** `07-box-mapping-dropdown.jpeg`, `08-box-options-list.jpeg`

**Significance:**

- Granular control: users can override AI suggestions at the invoice line-item level.
- Comprehensive box coverage: all 1099-NEC and 1099-MISC boxes are available.
- Manual adjustments: "+ Add additional spend" allows entry of off-platform transactions.
- Visual cues: the lightning bolt icon indicates AI-suggested mappings.

---

### 8. Filing Wizard: Start Screen (1:29–1:33)

**SAW:** A wizard modal appears with the Ramp logo and progress dots (step 1 of 4).

**Title:** "Start filing your 1099s"

Info callout: "The deadline for 1099 filing for the 2025 tax year is Feb 2, 2026"

**Steps:**

1. Confirm your company information
2. Review the vendors you're filing for
3. Select your filing and delivery method
4. Submit and file

Yellow "Continue" button below.

Small disclaimer text: "This feature is provided for your convenience only and does not constitute tax or legal advice. Ramp does not guarantee and is not liable for your compliance with tax regulations or requirements, and is not acting as a withholding agent on your behalf."

**Narrated:** "Once your forms are ready, you can go through the filing process."

**Snapshot:** `09-filing-wizard-start.jpeg`

**Significance:**

- Clear expectations: deadline prominently displayed.
- Staged wizard: 4-step process keeps users oriented.
- Legal compliance: disclaimer sets appropriate expectations.

---

### 9. Filing Wizard: Business Information Review (1:33–1:35)

**SAW:** Step 2 of the wizard shows:

**Title:** "Review business information for [Company Name]'s Company"

Subtitle: "This information will appear in the 'Payer' boxes on 1099 forms"

Fields displayed:

- **Payer's name:** [Company Name]'s Company
- **Payer's TIN:** 123456789
- **Tax address:** —
- **Phone number:** —

"Edit" button (ghost) below.

Yellow "Continue" button at bottom.

**Narrated:** "Review your business information."

**Snapshot:** `10-business-info-review.jpeg`

**Significance:**

- Data validation: users must confirm company TIN and address before filing.
- Editable: "Edit" button allows corrections without exiting the wizard.

---

### 10. Filing Wizard: Delivery Method Selection (1:39–1:43)

**SAW:** Step 3 of the wizard.

**Title:** "How do you want to deliver forms to vendors?"

Subtitle: "The IRS requires 1099 delivery to vendors by February 2, 2026"

Two radio card options:

- **Deliver digitally to vendors with e-consent** (selected, green border, "Recommended" badge)
  - $0.00 per digital form
  - "Mailing fees apply to vendors without e-consent" (note)
  - Checkmark in bottom-right
- **Deliver by mail**
  - $1.85 per mailed form

Yellow "Continue" button below.

**Narrated:** "Select whether or not you want to include state filing with your IRS filing. Confirm how you want your vendors to receive a copy of their 1099."

**Snapshot:** `11-delivery-method-selection.jpeg`

**Significance:**

- Cost transparency: per-form fees are disclosed upfront.
- Recommended path: Ramp nudges users toward digital delivery (faster, cheaper).
- Hybrid model: users without e-consent automatically receive mailed copies.

---

### 11. Filing Wizard: Purchase Summary (1:46–1:48)

**SAW:** Final step.

**Title:** "Purchase summary"

Info callout: "The total cost will be charged on your next Ramp Services statement"

**Line items:**

- Federal filing: $0.65 per form × 4 forms = $2.60
- State filing: Free × 4 forms = $0.00 (info icon)
- Mail delivery: $1.85 per form × 4 forms = $7.40

**Total cost:** $10.00

Large yellow "Purchase and file" button.

**Narrated:** "And then purchase and file. RAMP takes care of the entire 1099 process for you."

**Snapshot:** `12-purchase-summary.jpeg`

**Significance:**

- Transparent pricing: federal filing ($0.65/form), state filing (free in this case), mail delivery ($1.85/form).
- Single transaction: all fees are bundled into one Ramp Services charge.
- Turnkey filing: after this step, Ramp submits forms to IRS and states on the user's behalf.

---

## What We Take Into the Build

Based on this video, a Bill Pay clone with 1099 support must include:

1. **1099 Dashboard Entry Point**
   - Accessible from the main Vendors page (e.g., "Review 1099 vendors" button)
   - Company-scoped (multi-entity support via dropdown)

2. **Multi-Tab Workflow States**
   - **Overview:** All vendors aggregated
   - **Needs review:** Missing W-9, TIN, or e-consent
   - **Ready to file:** Complete and mappings confirmed
   - **Completed:** Forms filed
   - **Excluded vendors:** Manually opted out (corporations, non-US, etc.)

3. **Vendor Table Columns**
   - Status badge (visual indicator: orange "Missing tax details", green "Ready to file")
   - Total uncategorized spend
   - 1099-NEC total
   - 1099-MISC total
   - 1099 box assignment (abbreviated label, e.g., "Nonemployee compensation - Box 1" or "Multiple")
   - Default contact (email for W-9/e-consent requests)
   - Action buttons (context-sensitive: "Request tax details", "File 1099")

4. **Bulk Operations**
   - Multi-select vendors with checkboxes
   - Bottom sheet with action count ("2 vendors selected")
   - Bulk "Request tax details" (sends W-9 + e-consent emails)

5. **AI-Suggested Box Mappings**
   - Modal presenting category-to-box matches (e.g., "Rent & Lease Expense" → Box 1 - Rents)
   - Removable tag pills for each mapping
   - "Skip" and "Confirm" options

6. **Vendor Tax Details (Drawer)**
   - Vendor legal name (distinct from DBA)
   - Federal tax classification dropdown (Partnership, Sole Proprietor, LLC, S-Corp, C-Corp, etc.)
   - TIN (masked, with TIN verification badge)
   - E-consent status + request link
   - 1099 status per tax year (Yes/No toggles)
   - Full tax address
   - Verification badge ("Tax details verified by Ramp")

7. **Granular Box Mapping**
   - Bill line items table within vendor drawer
   - Per-line 1099 box dropdown (searchable)
   - Grouped options: 1099-NEC, 1099-MISC, Not reportable
   - Lightning bolt icon for AI-suggested mappings
   - "+ Add additional spend" for off-platform transactions

8. **Filing Wizard (4 Steps)**
   - **Step 1:** Overview + deadline callout
   - **Step 2:** Review payer business info (name, TIN, address, phone) with inline edit
   - **Step 3:** Delivery method selection (digital with e-consent vs. mail, with per-form costs)
   - **Step 4:** Purchase summary with line-item breakdown (federal, state, mail delivery fees) and total

9. **TIN Verification**
   - Integrate with IRS TIN Matching API (or third-party service)
   - Display verification status badge on vendor tax details

10. **E-Consent Management**
    - Store per-vendor e-consent status
    - Send e-consent request emails (link to consent form)
    - Track consent timestamp

11. **Auto-Population Logic**
    - Monitor vendor spend against IRS thresholds ($600 for most 1099-NEC/MISC)
    - Automatically add vendors to "Needs review" when threshold crossed

12. **State Filing Support**
    - Option to include state filing (some states mirror federal 1099 requirements)
    - Show state filing fees (or "Free" if bundled)

13. **Legal Disclaimers**
    - Display tax compliance disclaimer in filing wizard
    - Clarify Ramp is not acting as a tax advisor or withholding agent

14. **Pricing Transparency**
    - Show per-form fees at point of selection (federal filing, state filing, mail delivery)
    - Aggregate total cost before final submission

---

## Additional Notes

- **No confidential terms:** This report references only Ramp's UI and generic tax concepts (IRS 1099, W-9, TIN, e-consent). No client-specific codebases or proprietary business logic are mentioned.
- **Form types covered:** 1099-NEC (nonemployee compensation) and 1099-MISC (rents, royalties, other income, etc.). The UI suggests support for all standard boxes.
- **TIN Matching:** Ramp's "Tax details verified by Ramp" badge implies real-time or batch TIN validation, likely via the IRS TIN Matching Program or a third-party compliance vendor.
- **E-filing:** Ramp handles direct submission to the IRS and state agencies, positioning itself as a turnkey 1099 service (similar to Gusto, ADP, or TaxBandits).
