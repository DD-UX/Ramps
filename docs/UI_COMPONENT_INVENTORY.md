# Ramp Bill Pay UI Component Inventory
## Complete Design System Audit

**Date:** 2026-07-03
**Scope:** Exhaustive catalog of ALL reusable UI components/primitives observed in the Ramp Bill Pay product research corpus
**Sources:** 10 video walkthroughs + findings.md analysis + screenshot evidence
**Existing components (excluded):** Button, Checkbox, Input, Select, StatusPill, Tabs, Toast, Tooltip

---

## PRIORITY ZERO (P0) — Core MVP Components

These components appear everywhere across the Bill Pay product and are essential for a functional MVP.

### DataTable / BillsTable
**Purpose:** Primary workspace surface for viewing/managing bills, payments, vendors with sortable columns, filters, bulk selection
**Evidence:**
- `docs/watch-youtube/ramp-bill-pay-product-overview/findings.md` § Dashboard & Navigation (frame 01)
- `docs/watch-youtube/does-ramp-live-up-to-the-hype.../findings.md` § frames 11, 18
- `docs/watch-youtube/ramp-bill-pay-series-ap-agent/findings.md` frame 6
- Every single video shows a dense data table with sticky headers, selection checkboxes, sortable columns (Vendor, Status, Amount, Due Date, Payment Method, Actions)
- Table metrics from design-system.md: row height 64px, selection column 56px, gutter 44px, border 1px (sticky header 3px)
**Priority:** P0 (absolute centerpiece — the product lives in tables)

### Drawer / SidePanel
**Purpose:** Slide-in panel for bill detail, vendor detail, payment review — preserves list context while showing detail
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` § Bill Detail Drawer frames 05-06 (split pane: left=invoice PDF, right=form)
- `does-ramp-live-up-to-the-hype.../findings.md` frame 6 (worklist rail + form + invoice viewer)
- `ramp-bill-pay-series-1099-s/findings.md` frame 6 (vendor tax details drawer)
- Pattern: right-edge slide-in, overlay scrim, close X in header, tabbed content within drawer
**Priority:** P0 (every detail view uses this pattern)

### Modal / Dialog
**Purpose:** Interruptive confirmations, multi-step wizards, contextual actions requiring focus
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` § Add Context Modal (frame 09), Bulk Payment Review (frame 17)
- `does-ramp-live-up-to-the-hype.../findings.md` frame 13 ("When do you want to pay this bill?")
- `ramp-bill-pay-series-1099-s/findings.md` frames 9-12 (4-step filing wizard)
- Used for: payment confirmation, export review, approval actions, 1099 filing wizard
**Priority:** P0 (core interaction pattern for all confirmations)

### Avatar / UserChip
**Purpose:** User/vendor identity indicator with name, role, optional logo/photo
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 05 (vendor avatar circular in bill detail)
- `ramp-bill-pay-product-overview/findings.md` frame 13 (approver avatars: "Vendor Owner, Any Admin")
- `ramp-bill-pay-series-ap-agent/findings.md` frame 6 (vendor + submitter per row)
- Appears in: table rows (vendor column), approval chains, vendor detail headers, payment review
**Priority:** P0 (vendor/user identity is everywhere)

### EmptyState
**Purpose:** First-run or no-results placeholder with illustration, CTA, and alternative actions
**Evidence:**
- `does-ramp-live-up-to-the-hype.../findings.md` frame 2: "Drop invoices here or click to upload · Accepts PDF, PNG, or JPG, up to 50 MB per file" + `Try a sample invoice` + email/CSV/manual entry options below
- Large dashed dropzone with icon, primary message, file-spec help text, and 3 alternative entry-point links
**Priority:** P0 (critical for onboarding and no-results states)

### BulkActionBar / SelectionSummary
**Purpose:** Bottom-anchored bar showing selection count, total amount, bulk actions when rows are selected
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 16: "31 bills selected · $14,293,124.54 total · Edit (dropdown) · Review payments (button)"
- `ramp-accounting-series-bill-pay-ucsv-export/findings.md` frame 02: "7 bills selected - $89,177.43 total"
- `ramp-bill-pay-series-1099-s/findings.md` frame 4: "2 vendors selected · Request tax details (yellow button)"
**Priority:** P0 (bulk operations are a core workflow)

### Skeleton / LoadingRow
**Purpose:** Placeholder content shimmer during async operations
**Evidence:**
- `does-ramp-live-up-to-the-hype.../findings.md` frame 4: "Processing 1 document" with shimmering skeleton row after batch upload
- Pattern: optimistic row insert → skeleton → hydrated data
**Priority:** P0 (Ramp's async UX depends on this)

### Banner / Alert
**Purpose:** Persistent page-level or section-level messaging (errors, warnings, info, success)
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frames 02, 03: yellow fraud warning ("This bill might be fraudulent..."), duplicate warning ("This draft may be a duplicate...")
- `does-ramp-live-up-to-the-hype.../findings.md` frame 6: red blocking banner ("Add missing information for {vendor} · This vendor is missing a state and a vendor contact")
- `does-ramp-live-up-to-the-hype.../findings.md` frame 9: overdue banner ("This bill is 37 days overdue · Get it approved by 1:00 PM for same-day delivery · Add same-day delivery")
- `ramp-accounting-series-bill-pay-ucsv-export/findings.md` frame 4: blue info banner ("Improved Bill Pay exports - Bills and payments are now exported as separate files")
- Colors: red (error/blocking), yellow/amber (warning), blue (info), green (success)
**Priority:** P0 (validation, fraud, overdue, sync status all use banners)

### Card
**Purpose:** Sectioned content container with header, optional actions, collapsible states
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frames 14-15: approval state cards (amber "Review recommended" / green "Ready to approve" with checklist)
- `ramp-bill-pay-series-ap-agent/findings.md` frames 7-8: AI suggested-action cards with soft glow, icon, check/flag lists
- Pattern: colored border/glow, header with badge, body content (list/text), optional collapse
**Priority:** P0 (approval recommendations, vendor summaries, section grouping)

### Badge / Chip / Tag
**Purpose:** Compact inline label for metadata, counts, statuses (non-status-pill use cases)
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 07: "Coded by Ramp" badge next to auto-filled fields
- `ramp-bill-pay-product-overview/findings.md` frame 18: "Recommended" badge on email-forward option, "New" badge on payment methods
- `ramp-bill-pay-series-import-bills-netsuite/findings.md` frame 07: "Batched" badge on vendor-grouped payments
- `ramp-bill-pay-series-1099-s/findings.md` frame 2: count badges on tabs ("Needs review (2)", "Ready to file (3)")
- Used for: feature callouts, AI provenance, counts, new/beta labels
**Priority:** P0 (everywhere — not status pills but metadata/counts)

### FilterChips / SegmentedControl
**Purpose:** Horizontal row of toggleable filter pills for quick list filtering
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 01: "Missing info", "Ready for review", "Queued" filter chips in toolbar
- `does-ramp-live-up-to-the-hype.../findings.md` frame 17: Status filter chips "Ready for release | Scheduled | Initiated | +7 | Vendor: Amazon"
- `ramp-bill-pay-series-import-bills-quick-books-online/findings.md` frame 4: same pattern with +7 overflow
**Priority:** P0 (table filtering pattern used on every list)

### IconButton
**Purpose:** Square/circular button with icon only, no text (used in toolbars, actions, overflow menus)
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 01: Download icon, Options dropdown (three dots), View toggles (card/table/calendar icons)
- Overflow menu (three dots) appears in every table row's Actions column
**Priority:** P0 (toolbars and row-level actions)

### OverflowMenu / DropdownMenu / ActionMenu
**Purpose:** Three-dot menu revealing secondary actions
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 01: three-dot overflow in every table row
- `ramp-bill-pay-product-overview/findings.md` frame 06: vendor actions menu (Change vendor, Edit vendor details, View vendor)
- Pattern: three-dot trigger → popover with action list (destructive actions in red)
**Priority:** P0 (every table row has one)

### MoneyDisplay / CurrencyText
**Purpose:** Formatted money amounts with currency symbol, thousands separators, right-alignment
**Evidence:**
- Every table screenshot shows right-aligned currency (e.g., "$3,514.92", "$25,923.29")
- `ramp-bill-pay-product-overview/findings.md` bottom status bar: "$494,520.80 total + 5 more currencies"
- Pattern: right-aligned, monospace or tabular numerals, comma separators, 2 decimal precision
**Priority:** P0 (financial data everywhere)

### StatusBadge / LifecyclePill (variant of StatusPill already built)
**Purpose:** Colored pill indicating bill/payment lifecycle state
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 01: "Missing info", "Ready for review", "Queued"
- `does-ramp-live-up-to-the-hype.../findings.md` frames 11-12: "0 of 1 approval" → "1 of 1 approval" (green check)
- `ramp-bill-pay-series-import-bills-quick-books-online/findings.md` frame 4: "Unscheduled" (red/pink), "Ready for release" (orange dot)
**Note:** Already built as StatusPill, but may need additional **lifecycle-specific variants** (approval counters, batched, imported labels)

---

## PRIORITY ONE (P1) — Important for Rich Experience

These components appear frequently and significantly improve UX, but are not blocking for core workflows.

### Pagination / TableFooter
**Purpose:** Navigation controls for large datasets with page size selector
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 01 bottom: "1-21 of 21 drafts" + total amount
- Pattern: "X-Y of Z items" + page navigation arrows + optional page size dropdown
**Priority:** P1 (important for large lists, but MVP can default to "load all")

### SearchInput / FilterInput
**Purpose:** Search bar with icon, placeholder, optional filter dropdown integration
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 01: "Search or add filter..." with magnifying glass icon + filter dropdown
**Priority:** P1 (enhances discoverability but not blocking)

### DatePicker / Calendar
**Purpose:** Date selection widget with calendar grid, range selection
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frames 05, 10: Invoice date, Due date, Payment date pickers
- `does-ramp-live-up-to-the-hype.../findings.md` frame 9: Schedule now/later toggle with payment date picker showing "2 business days" → Arrival date computation
**Priority:** P1 (dates are everywhere, but native input[type=date] works for MVP)

### Breadcrumb
**Purpose:** Hierarchical navigation trail
**Evidence:**
- Not directly visible in screenshots, but implied by deep navigation (Vendors → Vendor Detail → 1099 Dashboard → Filing Wizard)
- Likely exists in multi-step flows
**Priority:** P1 (nice-to-have for deep nav, but tabs/drawers reduce need)

### ProgressBar / ProgressIndicator
**Purpose:** Visual progress through multi-step flows
**Evidence:**
- `ramp-bill-pay-series-1099-s/findings.md` frame 9: "step 1 of 4" with progress dots
- `ramp-bill-pay-series-import-bills-quick-books-online/findings.md` frame 5: payment status progress bar ("Overdue — Unscheduled" with stages: Awaiting approvals | Scheduled | Payment initiated | Payment delivered)
**Priority:** P1 (wizards and lifecycle visualization)

### Stepper / WizardNav
**Purpose:** Step indicator for multi-step forms
**Evidence:**
- `ramp-bill-pay-series-1099-s/findings.md` frames 9-12: 1099 filing wizard with 4 steps (Overview → Business info → Delivery method → Purchase summary)
- Pattern: numbered steps, current step highlighted, completed steps checkmarked
**Priority:** P1 (multi-step flows like 1099 filing, payment scheduling)

### FileDropzone / UploadArea
**Purpose:** Drag-and-drop file upload zone with file type/size constraints
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 04: full-screen dropzone "Drop multiple invoices here to bulk upload them!" with blue file badge preview
- `does-ramp-live-up-to-the-hype.../findings.md` frame 2: dashed border dropzone "Drop invoices here or click to upload · Accepts PDF, PNG, or JPG, up to 50 MB per file"
**Priority:** P1 (core ingest flow, but can start with simple file input)

### InvoiceViewer / DocumentPreview
**Purpose:** Embedded PDF/image viewer with zoom controls
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 05: left pane shows zoomable invoice PDF
- `does-ramp-live-up-to-the-hype.../findings.md` frame 6: side-by-side layout (left=invoice, middle=form, right=details)
- `ramp-bill-pay-series-ap-agent/findings.md` frame 9: invoice panel with matching line table
**Priority:** P1 (critical for review workflows, but can start with simple iframe/image)

### VendorLogo / EntityIcon
**Purpose:** Vendor brand logo or fallback monogram in circular frame
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 05: circular vendor avatar/logo (ACME)
- `ramp-bill-pay-series-import-bills-netsuite/findings.md` frame 7: Amazon icon (A in circle) in batch payment review
**Priority:** P1 (polish, but initials fallback works for MVP)

### Combobox / Autocomplete
**Purpose:** Searchable dropdown with typeahead filtering
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 07: "NetSuite Category" dropdown with search (likely autocomplete for long option lists)
- `ramp-bill-pay-series-1099-s/findings.md` frame 7: 1099 box dropdown with search field at top
**Priority:** P1 (enhances GL account/category pickers, but basic Select works for MVP)

### MultiSelect
**Purpose:** Dropdown allowing multiple selections with tag chips
**Evidence:**
- `does-ramp-live-up-to-the-hype.../findings.md` frame 15: "Send a request" modal with checkboxes for multiple payment/tax detail requests
- Pattern: checkboxes in list → selected items shown as removable tags
**Priority:** P1 (vendor request flow, bulk operations)

### RadioGroup / RadioCards
**Purpose:** Mutually exclusive selection with larger card-based options
**Evidence:**
- `ramp-bill-pay-series-1099-s/findings.md` frame 11: delivery method selection (Deliver digitally vs Deliver by mail) shown as full-width radio cards with descriptions, badges ("Recommended"), pricing ($0.00 vs $1.85 per form), checkmark in selected card
**Priority:** P1 (payment method selection, settings choices)

### Toggle / Switch
**Purpose:** Binary on/off control
**Evidence:**
- `ramp-bill-pay-series-import-bills-netsuite/findings.md` frame 2: "Import bills from NetSuite" toggle (green, ON position)
- `does-ramp-live-up-to-the-hype.../findings.md` frame 9: "Schedule now / Schedule later" toggle
**Priority:** P1 (settings, feature flags)

### Divider / Separator
**Purpose:** Visual section separator (horizontal rule)
**Evidence:**
- Visible between form sections in every bill detail drawer
- Between vendor actions in overflow menus
**Priority:** P1 (visual hierarchy, but margin/border can substitute)

### Popover / HoverCard
**Purpose:** Floating contextual info on hover/click
**Evidence:**
- `ramp-bill-pay-series-ap-agent/findings.md` frame 7: vendor hovercard on hover (logo, blurb, approver + department)
- Pattern: triggered by hover or click, floating above content with arrow pointer
**Priority:** P1 (rich hover states, help text)

### Timeline / ActivityLog
**Purpose:** Chronological event feed with timestamps, actors, actions
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` mentions "Activity" tab in bill detail
- `does-ramp-live-up-to-the-hype.../findings.md` references activity events for audit trail
- Pattern: vertical timeline with icons, actor names, action descriptions, timestamps
**Priority:** P1 (audit/compliance, but can start simple)

### KeyValueList / DefinitionList
**Purpose:** Label-value pairs in structured layout
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 05: Bill details section (Invoice #, Invoice date, Due date, Accounting date)
- `ramp-bill-pay-series-1099-s/findings.md` frame 6: Vendor tax details (Vendor legal name, Federal tax classification, TIN, Address)
**Priority:** P1 (everywhere, but simple dl/dt/dd works)

### InfoTooltip / HelpIcon
**Purpose:** Small (i) icon triggering tooltip with contextual help
**Evidence:**
- `ramp-bill-pay-series-1099-s/findings.md` frame 12: info icon next to "State filing: Free × 4 forms"
- Pattern: small circled "i" or "?" icon, hover/click shows tooltip
**Priority:** P1 (inline help, but Tooltip already built)

### Link / ExternalLink
**Purpose:** Hyperlink with optional external indicator
**Evidence:**
- `ramp-bill-pay-series-import-bills-quick-books-online/findings.md` frame 5: "Open in QuickBooks" with external link icon (→)
- `ramp-bill-pay-series-import-bills-netsuite/findings.md` frame 4: "Open in NetSuite" deep link
- Pattern: underlined text + external arrow icon for out-of-app links
**Priority:** P1 (external integrations, but anchor tag works)

### CollapsibleSection / Accordion
**Purpose:** Expandable/collapsible content section
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 14: "Show less" link on approval checks
- `ramp-accounting-series-bill-pay-ucsv-export/findings.md` frame 3: "Bills that will be exported (7 items)" collapsible section
- `ramp-bill-pay-series-1099-s/findings.md` frame 6: "Bill line items" collapsible section marked "Ready to file"
**Priority:** P1 (progressive disclosure)

### LoadingSpinner / Spinner
**Purpose:** Indeterminate loading indicator
**Evidence:**
- Implied by "Processing 1 document" skeleton rows and async upload flows
- Likely used during file upload, payment processing, sync operations
**Priority:** P1 (feedback during async ops, but skeleton preferred)

---

## PRIORITY TWO (P2) — Nice-to-Have / Polish

These components add polish or appear in limited contexts, but are not essential for MVP.

### PaymentMethodCard / PaymentMethodIcon
**Purpose:** Visual representation of payment methods (ACH, wire, check, card) with icons and descriptions
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frames 10-12: payment method dropdown showing icons + labels (ACH icon, check icon, card icon)
- `ramp-bill-pay-series-import-bills-quick-books-online/findings.md` frame 8: payment method selector with icons and multi-line descriptions
**Priority:** P2 (enhances payment UX, but text labels work)

### VirtualCardPreview
**Purpose:** Mock credit card visual showing card details
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 13: virtual card preview showing "Virtual INV# 2025-00125 from ACME" + billing address + amount
**Priority:** P2 (card payment feature only)

### CashbackBadge / PromotionalBanner
**Purpose:** Highlighted upsell/promotion messaging
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 12: "Earn up to $87,750 cashback without the swipe" banner in payment flow
- `ramp-bill-pay-series-import-bills-netsuite/findings.md` frame 6: "1% cashback" badge on card payment method
**Priority:** P2 (marketing/upsell, not core functionality)

### ApprovalChain / ApproverList
**Purpose:** Ordered list of approvers with sequence numbers, status indicators
**Evidence:**
- `does-ramp-live-up-to-the-hype.../findings.md` frame 10: "Approvals" section with ordered list "1 · Hannah Smolinski · Any Admin" + "+ Add approver" button
- `ramp-bill-pay-series-ap-agent/findings.md` frame 6: "N of M approvals" counter per row + "Next approver: Needs your approval"
**Priority:** P2 (approval feature, can start with simple list)

### ImportLabel / SyncTimestamp
**Purpose:** Metadata badge showing import source and timestamp
**Evidence:**
- `ramp-bill-pay-series-import-bills-quick-books-online/findings.md` frame 4: "Imported - Jan 23, 2025" label on bill rows
- `ramp-bill-pay-series-import-bills-netsuite/findings.md` frame 4: "Imported on 2/3/25 · Open in NetSuite" in bill header
- `ramp-bill-pay-series-import-bills-quick-books-online/findings.md` frame 4: yellow banner "Imported bills last updated Jan 24, 2025, 10:30 AM" with "Refresh" button
**Priority:** P2 (integration provenance, but Badge + text works)

### BatchedLabel / GroupingBadge
**Purpose:** Indicator that multiple bills are batched into single payment
**Evidence:**
- `ramp-bill-pay-series-import-bills-netsuite/findings.md` frame 7: "Batched" badge (gray) on vendor-grouped payment row
- `ramp-bill-pay-product-overview/findings.md` frame 17: "8 bills · ACH (Direct deposit) — Batched"
**Priority:** P2 (batch payment feature, but simple badge works)

### CountBadge / NotificationBadge
**Purpose:** Small circular badge with count (e.g., on tabs, icons)
**Evidence:**
- `ramp-bill-pay-series-1099-s/findings.md` frame 2: "Needs review (2)", "Ready to file (3)" count badges on tabs
**Priority:** P2 (polish, but text works)

### TableViewToggle / ViewSwitcher
**Purpose:** Icon buttons to toggle between table/card/calendar views
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 01: View toggles (card view, table view, calendar view icons) in toolbar
**Priority:** P2 (alternate views not in MVP scope)

### EntitySwitcher / OrgSwitcher
**Purpose:** Dropdown to switch between companies/entities
**Evidence:**
- `ramp-bill-pay-series-1099-s/findings.md` frame 2: "1099 vendors for [Company Name]" with company dropdown
- `ramp-bill-pay-series-import-bills-netsuite/findings.md` frame 2: "Editing settings for: Finance's Tofu Speakeasy" entity selector
**Priority:** P2 (multi-entity support post-MVP)

### SuggestedActionCard (specialized Card variant)
**Purpose:** AI-driven recommendation card with amber/green color coding, checklist of passed/failed checks
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frames 14-15: "Review recommended" (amber) vs "Ready to approve" (green) with beta badge, summary, flagged items vs checks passed
- `ramp-bill-pay-series-ap-agent/findings.md` frames 7-8: same pattern with soft glow effect
**Priority:** P2 (AI feature, but Card + conditional styling works)

### DrawingMode / AnnotationOverlay
**Purpose:** Interactive overlay on invoice allowing region selection/highlighting
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 08: "Exit drawing mode" button + highlighted region on invoice + "Add context" modal triggered by selection
**Priority:** P2 (advanced OCR training feature, out of MVP scope)

### VendorRequestModal (specialized Modal)
**Purpose:** Multi-select form for requesting vendor information via email
**Evidence:**
- `does-ramp-live-up-to-the-hype.../findings.md` frame 15: "Send a request" modal with checkboxes for ACH details, Check details, Wire details, Tax details (W-8/W-9), optional message, attachment picker
**Priority:** P2 (vendor onboarding feature, but Modal + Checkbox works)

### TINMask / SensitiveDataDisplay
**Purpose:** Masked display of sensitive data with lock icon
**Evidence:**
- `ramp-bill-pay-series-1099-s/findings.md` frame 6: "Taxpayer Identification Number (TIN): ••••••• (masked, with lock icon)"
**Priority:** P2 (security feature, but simple masking works)

### VerificationBadge
**Purpose:** Trust indicator for verified data
**Evidence:**
- `ramp-bill-pay-series-1099-s/findings.md` frame 6: "Tax details verified by Ramp" with checkmark badge
**Priority:** P2 (compliance feature, but Badge works)

### DeliveryTimeline / PaymentTimeline
**Purpose:** Visual timeline showing "2 business days" with arrow to arrival date
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 10: "Payment date" → "2 business days" → "Arrival date"
- `does-ramp-live-up-to-the-hype.../findings.md` frame 9: same pattern with overdue context
**Priority:** P2 (nice UX, but text works)

### SectionCompletionPill
**Purpose:** Per-section status indicator in forms
**Evidence:**
- `does-ramp-live-up-to-the-hype.../findings.md` frame 6: "Vendor: Incomplete", "Bill details: Complete", "Line items: Incomplete/Complete" pills per form section
**Priority:** P2 (progressive validation, but StatusPill variant works)

### AIProvenianceBadge
**Purpose:** Small lightning bolt or "AI" icon indicating auto-generated content
**Evidence:**
- `ramp-bill-pay-product-overview/findings.md` frame 07: "Coded by Ramp" badge on auto-filled GL codes
- `ramp-bill-pay-series-1099-s/findings.md` frame 7: lightning bolt icon on AI-suggested 1099 box mappings
**Priority:** P2 (transparency, but Badge works)

### OverdueIndicator / UrgencyBadge
**Purpose:** Red "Overdue" label in date columns
**Evidence:**
- `ramp-bill-pay-series-import-bills-quick-books-online/findings.md` frame 4: "Overdue" in red on due date column
**Priority:** P2 (StatusPill variant or text styling)

### PriceTag / CostLabel
**Purpose:** Inline pricing display with per-unit breakdown
**Evidence:**
- `ramp-bill-pay-series-1099-s/findings.md` frame 11: "$0.00 per digital form" vs "$1.85 per mailed form"
- `ramp-bill-pay-series-1099-s/findings.md` frame 12: "$0.65 per form × 4 forms = $2.60"
**Priority:** P2 (1099 filing feature, but text works)

### ConfidenceIndicator / RecommendedBadge
**Purpose:** Visual indicator of AI confidence or product recommendation
**Evidence:**
- `ramp-bill-pay-series-1099-s/findings.md` frame 11: "Recommended" badge on digital delivery option (green border on card)
**Priority:** P2 (Badge variant)

### DataQualityLabel
**Purpose:** Indicator for incomplete or flagged data
**Evidence:**
- `does-ramp-live-up-to-the-hype.../findings.md` frame 19-20: "Line items: Incomplete" status on OCR failure
**Priority:** P2 (StatusPill variant)

---

## VARIANT EXTENSIONS NEEDED FOR EXISTING COMPONENTS

These are NOT new components, but existing components that need additional variants based on evidence.

### Button (already built) — Add Variants:
- **Loading state with spinner:** payment processing, file upload
- **Icon + text combinations:** "Review payments (30)", "Approve & schedule"
- **Destructive variant (red outline):** "Reject" button in approval flow
- **Ghost/secondary variant:** "Cancel", "Skip", "Edit" buttons

### Checkbox (already built) — Add Variants:
- **Table row selection:** indeterminate state for partial selection
- **Checkbox list in modals:** multi-select vendor requests, export options

### Select (already built) — Add Variants:
- **With search/filter:** GL account picker, 1099 box dropdown
- **Grouped options:** payment methods grouped by type, 1099 boxes grouped by form (NEC vs MISC)
- **With icons:** payment method selector with ACH/check/card icons
- **Multi-line options:** payment methods with descriptions below labels

### StatusPill (already built) — Add Variants:
- **Approval counter:** "0 of 2 approvals" → "2 of 2 approvals" with checkmark
- **Dotted variants:** "Ready for release" with orange/yellow dot icon
- **Section completion:** "Incomplete" (amber) vs "Complete" (green) per form section
- **Import/batch labels:** "Imported · Feb 3, 2025", "Batched" (gray)

### Tabs (already built) — Add Variants:
- **With count badges:** "Needs review (2)", "Ready to file (3)"
- **Secondary tabs within drawers:** "Overview · Payment & tax · Insights" in vendor detail
- **In modals:** CSV export settings tabs (Card transactions, Bill expense, Bill payment)

### Tooltip (already built) — Add Variants:
- **Info tooltip with icon:** (i) icon + hover tooltip for inline help
- **Rich tooltip with formatted content:** vendor hovercard with multi-line info

---

## SUMMARY STATISTICS

- **P0 components:** 15 (absolute must-haves)
- **P1 components:** 23 (important for rich UX)
- **P2 components:** 25 (polish/advanced features)
- **Variant extensions:** 6 existing components need new variants
- **Total new components needed:** 63
- **Already built (excluded):** 8 (Button, Checkbox, Input, Select, StatusPill, Tabs, Toast, Tooltip)

---

## NOTES ON EXISTING COMPONENT GAPS

The 8 already-built components cover the basics, but many P0/P1 components are still missing:

**Critical gaps for MVP:**
1. **DataTable** — the entire product lives in tables (P0)
2. **Drawer** — every detail view uses this pattern (P0)
3. **Modal** — confirmations, wizards, actions (P0)
4. **EmptyState** — onboarding and no-results (P0)
5. **BulkActionBar** — bulk operations are core to AP workflows (P0)
6. **Skeleton** — async UX depends on this (P0)
7. **Banner/Alert** — validation, warnings, sync status (P0)
8. **Card** — approval cards, vendor summaries, section grouping (P0)

**Next tier (P1):**
- Pagination, SearchInput, DatePicker, ProgressBar, FileDropzone, InvoiceViewer, Combobox, MultiSelect, RadioCards, Toggle, Timeline, KeyValueList

The existing 8 components are a foundation, but the design system needs **at least 15 more P0 components** to ship a credible Bill Pay MVP.
