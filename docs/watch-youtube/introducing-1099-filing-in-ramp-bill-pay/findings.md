# Introducing 1099 Filing in Ramp Bill Pay

**Source:** [YouTube](https://www.youtube.com/watch?v=7Lmr1BHsJmY)
**Duration:** 38 seconds
**Type:** Product teaser
**Date Captured:** 2026-07-03

---

## Overview

This short promotional video introduces Ramp's new 1099 e-filing capability integrated directly into their Bill Pay product. The teaser positions 1099 filing as a seamless extension of existing vendor payment workflows, eliminating manual data entry and simplifying year-end compliance for businesses that pay contractors and vendors.

---

## Key Pain Points Addressed

**SAW: Three pain points in white text on black background** ([01-pain-points.jpeg](./snapshots/01-pain-points.jpeg))

The opening frames highlight common 1099 filing frustrations:

- "Emailing vendors?"
- "Manual entries?"
- "Chasing W9s?"

These questions establish the problem space: gathering vendor information, manual data transcription, and the administrative overhead of Form W-9 collection. This sets up the value proposition that follows.

---

## Calendar-Based Urgency

**SAW: Calendar grid showing dates 16-26** ([02-calendar-deadline.jpeg](./snapshots/02-calendar-deadline.jpeg))

The video uses a calendar visual with the word "from weeks" to establish a time-based benefit. This implies that traditional 1099 filing takes weeks, setting up the speed claim that follows.

---

## Speed Promise

**SAW: Word "minutes" in white pill-shaped outline on blue gradient** ([03-time-promise.jpeg](./snapshots/03-time-promise.jpeg))

The claim "from weeks to minutes" is visually reinforced with animation. This positions Ramp's solution as dramatically faster than manual processes, likely through automation and pre-populated vendor data.

---

## Automatic Payment Categorization (Step 2)

**SAW: Modal showing "1099 MISC" form with categorized payments** ([04-auto-categorize.jpeg](./snapshots/04-auto-categorize.jpeg))

A key workflow screenshot shows:

- Header: "Step 2"
- Left text: "Automatically categorizes payments"
- Right panel: "1099 MISC" heading
  - **Box 1 - Rents** with tags: "Rent or Lease", "Office rent"
  - **Box 2 - Royalties** (partially visible)

This demonstrates intelligent transaction categorization based on existing Bill Pay data. The system maps vendor payments to specific 1099-MISC boxes (Box 1 for rents, Box 2 for royalties, etc.) using transaction metadata or merchant categories. The tags suggest rule-based or ML-powered classification.

**Implication for a Bill Pay clone:** Payment data should include categorical metadata (rent, royalties, legal fees, etc.) that can automatically map to IRS 1099 box requirements. Consider displaying confidence scores or allowing users to review/override automated classifications before filing.

---

## Form Generation (Step 3)

**SAW: Placeholder table representing 1099 forms** ([05-generate-forms.jpeg](./snapshots/05-generate-forms.jpeg))

The left text reads "Generates 1099s" with a right panel showing a blurred/placeholder "Form 1099" grid. This step likely compiles the categorized payment data into actual IRS forms, ready for review or submission.

---

## Filing Dashboard / Review Table

**SAW: Data table with vendor filing status** ([06-filing-table.jpeg](./snapshots/06-filing-table.jpeg))

A detailed table view shows:

**Tabs:**

- "Needs filing" (5)
- "Completed" (2)
- "Excluded vendors"

**Columns:**

- **Status**: All shown as "Ready to file"
- **Total NEC to report**: Consistent $1,234.56 for all rows
- **Total MISC to report**: Varies ($1,234.56, $6,742.12, $2,156.09, $12,065.54, $67,671.89, $23,995.27, $9,381.48, $923.91)
- **1099 box**: Shows classification (e.g., "Box 1 - Nonemployment", "Multiple")
- **Total to report**: Final amounts per vendor

**Key observations:**

- Multi-vendor batch processing with per-vendor totals
- Support for both 1099-NEC and 1099-MISC in same workflow
- "Multiple" box indicator when vendor receives payments across categories
- Tabbed navigation separates filing stages (needs filing, completed, excluded)
- "Ready to file" status implies pre-validation or data completeness checks

**Implication for a Bill Pay clone:** The filing dashboard should aggregate vendor payments by tax form type (NEC vs. MISC), show box-level breakdowns, and provide clear status indicators. Support batch operations while allowing row-level review before submission.

---

## Call to Action

**SAW: Yellow button with text "File 1099s"** ([07-file-cta.jpeg](./snapshots/07-file-cta.jpeg))

A prominent yellow/lime CTA button labeled "File 1099s" appears against a blue gradient background. This is the final action trigger to submit forms to the IRS and states (likely with user confirmation).

---

## Branding

**SAW: "Bill Pay by ramp" wordmark with logo** ([08-ramp-branding.jpeg](./snapshots/08-ramp-branding.jpeg))

Closing frame shows "Bill Pay by ramp" branding, reinforcing that 1099 filing is an integrated feature of the broader Bill Pay product, not a standalone service.

---

## What We Take Into the Build

For a Bill Pay clone implementing 1099 e-filing:

1. **Integrated 1099 Filing Entry Point**: Position e-filing as a natural extension of payment workflows, not a separate module. Users should transition from "paying vendors" to "filing 1099s" without context switching.

2. **Automated Payment Categorization**: Leverage transaction data (merchant category, GL codes, payment descriptions) to pre-classify vendor payments into IRS 1099 boxes (MISC Box 1 for rents, Box 2 for royalties, NEC Box 1 for contractor payments). Surface categorizations for user review before filing.

3. **Multi-Vendor Filing Dashboard**: Provide a tabbed interface separating "Needs filing" (action required), "Completed" (already submitted), and "Excluded vendors" (below threshold or exempt). Each row should show NEC totals, MISC totals, box breakdowns, and filing status.

4. **Box-Level Breakdown UI**: Display which 1099 box(es) each vendor qualifies for, with the ability to handle "Multiple" boxes for vendors receiving different payment types (e.g., both rent and legal fees).

5. **Batch Operations with Row-Level Review**: Allow bulk filing while providing granular control. Users should be able to exclude specific vendors, adjust categorizations, or defer filing individual forms without blocking the entire batch.

6. **Speed Messaging**: Communicate time savings prominently ("from weeks to minutes"). Highlight automation of W-9 collection, data entry, and form generation.

7. **Status-Driven Workflow**: Use clear status labels ("Ready to file", "Needs attention", "Filed") and gate the "File 1099s" CTA until all required data is validated (vendor TINs, address completeness, threshold checks).

8. **Deadline Awareness**: Surface filing deadlines (January 31 for most 1099s) with countdown timers or urgency indicators during tax season.

---

**Note on Related Content**: Ramp has a separate, longer video titled "How to File 1099s in Ramp" (51 seconds) that likely provides more detailed workflow walkthroughs. Cross-reference that video for additional UI/UX details on W-9 collection, recipient delivery options (digital vs. mail), and IRS e-file confirmation screens.
