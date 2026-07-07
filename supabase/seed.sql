-- ramps — seed data
--
-- One `supabase db reset` reproduces the whole demo: the policy catalog, a
-- cast of users across all three roles, accounting dimensions, vendors, and a
-- spread of bills touching EVERY lifecycle state (plus one failed payment that
-- sent its bill back to `approved`). Runs AFTER ./migrations on reset.
--
-- Values mirror the zod SSoT in @ramps/schemas: PolicyKeySchema / ROLE_POLICIES
-- seed `policies` + `role_policies`; every enum value used here is a member of
-- its z.enum(). Money is integer cents. Ids are pinned literals so the seed is
-- deterministic (re-running yields the same graph) and cross-references are
-- readable.

begin;

-- ---------------------------------------------------------------------------
-- Policy catalog + role → policies (policies.ts: PolicyKeySchema, ROLE_POLICIES)
-- The row set of `policies` equals the enum's members; role_policies encodes
-- ROLE_POLICIES exactly — note accounts_payable deliberately LACKS bill.approve
-- (separation of duties).
-- ---------------------------------------------------------------------------
insert into policies (key) values
  ('employee.all'), ('billpay.view'), ('bill.create'), ('bill.submit'),
  ('bill.edit'), ('bill.approve'), ('bill.pay'), ('vendor.view'),
  ('vendor.manage'), ('payment.view'), ('policy.manage'), ('user.manage');

-- admin = every policy
insert into role_policies (role, policy_key)
  select 'admin'::role, key from policies;

-- accounts_payable = the AP add-on, minus bill.approve / policy.manage / user.manage
insert into role_policies (role, policy_key) values
  ('accounts_payable', 'employee.all'),
  ('accounts_payable', 'billpay.view'),
  ('accounts_payable', 'bill.create'),
  ('accounts_payable', 'bill.submit'),
  ('accounts_payable', 'bill.edit'),
  ('accounts_payable', 'bill.pay'),
  ('accounts_payable', 'vendor.view'),
  ('accounts_payable', 'vendor.manage'),
  ('accounts_payable', 'payment.view');

-- employee = employee.all only (no Bill Pay by default)
insert into role_policies (role, policy_key) values
  ('employee', 'employee.all');

-- ---------------------------------------------------------------------------
-- Users (users.ts) — seeded identities, no signup. The role switcher acts as
-- one of these; authorization stays real via effectivePolicies().
-- ---------------------------------------------------------------------------
-- Three users per role so "Add approver by role" (snapshot 10) resolves each
-- role to a believable GROUP of avatars, not a single person — admin, AP and
-- employee each carry three. Ids 106–109 mirror migration
-- 0004_phantom_approver_users.sql (which tops up an already-migrated DB).
insert into users (id, name, email, role, avatar_url) values
  ('11111111-1111-1111-1111-111111111101', 'Diego Diaz',      'diego@ramps.demo',   'admin',            null),
  ('11111111-1111-1111-1111-111111111102', 'Ava Chen',        'ava@ramps.demo',     'accounts_payable', null),
  ('11111111-1111-1111-1111-111111111103', 'Marcus Reid',     'marcus@ramps.demo',  'accounts_payable', null),
  ('11111111-1111-1111-1111-111111111104', 'Priya Nair',      'priya@ramps.demo',   'admin',            null),
  ('11111111-1111-1111-1111-111111111105', 'Tom Ellison',     'tom@ramps.demo',     'employee',         null),
  ('11111111-1111-1111-1111-111111111106', 'Nadia Okafor',    'nadia@ramps.demo',   'admin',            null),
  ('11111111-1111-1111-1111-111111111107', 'Sofia Marin',     'sofia@ramps.demo',   'accounts_payable', null),
  ('11111111-1111-1111-1111-111111111108', 'Leo Park',        'leo@ramps.demo',     'employee',         null),
  ('11111111-1111-1111-1111-111111111109', 'Hannah Smolinski','hannah@ramps.demo',  'employee',         null);

-- One per-user override, to exercise the model: Marcus (AP) is granted
-- bill.approve for a specific need — include wins unless later excluded.
insert into user_policy_overrides (user_id, policy_key, mode) values
  ('11111111-1111-1111-1111-111111111103', 'bill.approve', 'include');

-- ---------------------------------------------------------------------------
-- Business entities (bills.ts → EntitySchema)
-- ---------------------------------------------------------------------------
insert into entities (id, name) values
  ('22222222-2222-2222-2222-222222222201', 'Ramps Inc.'),
  ('22222222-2222-2222-2222-222222222202', 'Ramps EU GmbH');

-- ---------------------------------------------------------------------------
-- Accounting dimensions (dimensions.ts) — seeded locally; `source` marks
-- provenance. The demo codes against NetSuite in the video, so a couple carry
-- that source with an external_id; the rest are 'seed'.
-- ---------------------------------------------------------------------------
insert into gl_accounts (id, name, code, category, type, active, external_id, source) values
  ('33333333-3333-3333-3333-333333333301', 'Office Supplies',       '6010', 'Operating Expenses', 'Expense', true, 'NS-6010', 'netsuite'),
  ('33333333-3333-3333-3333-333333333302', 'Software Subscriptions','6020', 'Operating Expenses', 'Expense', true, 'NS-6020', 'netsuite'),
  ('33333333-3333-3333-3333-333333333303', 'Professional Services', '6030', 'Operating Expenses', 'Expense', true, null,       'seed'),
  ('33333333-3333-3333-3333-333333333304', 'Marketing',             '6040', 'Operating Expenses', 'Expense', true, null,       'seed');

insert into departments (id, name, code, active, external_id, source) values
  ('44444444-4444-4444-4444-444444444401', 'Engineering', 'ENG', true, null, 'seed'),
  ('44444444-4444-4444-4444-444444444402', 'Marketing',   'MKT', true, null, 'seed'),
  ('44444444-4444-4444-4444-444444444403', 'Operations',  'OPS', true, null, 'seed');

insert into classes (id, name, code, active, external_id, source) values
  ('55555555-5555-5555-5555-555555555501', 'Billable',     'BILL', true, null, 'seed'),
  ('55555555-5555-5555-5555-555555555502', 'Non-billable', 'NONB', true, null, 'seed');

insert into locations (id, name, code, active, external_id, source) values
  ('66666666-6666-6666-6666-666666666601', 'San Francisco', 'SF',  true, null, 'seed'),
  ('66666666-6666-6666-6666-666666666602', 'New York',      'NYC', true, null, 'seed');

insert into custom_dimensions (id, name, code, field, active, external_id, source) values
  ('77777777-7777-7777-7777-777777777701', 'Project Atlas', 'ATLAS', 'Project', true, 'NS-PRJ-ATLAS', 'netsuite');

insert into tax_codes (id, name, rate_bps, active, external_id, source) values
  ('88888888-8888-8888-8888-888888888801', 'No Tax',    0,   true, null, 'seed'),
  ('88888888-8888-8888-8888-888888888802', 'CA Sales',  875, true, null, 'seed');

-- ---------------------------------------------------------------------------
-- Payment accounts (payments.ts → PaymentAccountSchema) — the "Pay from" picker.
-- ---------------------------------------------------------------------------
insert into payment_accounts (id, name, bank_name, account_number_masked, balance_cents) values
  ('99999999-9999-9999-9999-999999999901', 'Operating Checking', 'SVB',           '•••• 4821', 124000000),
  ('99999999-9999-9999-9999-999999999902', 'Reserve',            'JPMorgan Chase','•••• 7702', 500000000);

-- ---------------------------------------------------------------------------
-- Vendors (vendors.ts) — first-class: owner, default method, remembered coding.
-- ---------------------------------------------------------------------------
insert into vendors (id, name, owner_id, default_payment_method, default_coding, bank_details, status) values
  ('a0000000-0000-0000-0000-0000000000e1'::uuid, 'W.B. Mason',      '11111111-1111-1111-1111-111111111102', 'ach',
   '{"gl_account_id":"33333333-3333-3333-3333-333333333301","department_id":"44444444-4444-4444-4444-444444444403","class_id":"55555555-5555-5555-5555-555555555502","location_id":"66666666-6666-6666-6666-666666666601","custom_dimension_id":null,"billable":false}'::jsonb,
   '{"account_holder":"W.B. Mason Co.","bank_name":"Bank of America","routing_number":"011000138","account_number_masked":"•••• 3391"}'::jsonb, 'active'),
  ('a0000000-0000-0000-0000-0000000000e2'::uuid, 'Figma Inc.',      '11111111-1111-1111-1111-111111111103', 'card',
   '{"gl_account_id":"33333333-3333-3333-3333-333333333302","department_id":"44444444-4444-4444-4444-444444444401","class_id":"55555555-5555-5555-5555-555555555502","location_id":"66666666-6666-6666-6666-666666666601","custom_dimension_id":null,"billable":false}'::jsonb,
   null, 'active'),
  ('a0000000-0000-0000-0000-0000000000e3'::uuid, 'Anderson Legal',  '11111111-1111-1111-1111-111111111104', 'wire',
   null, '{"account_holder":"Anderson & Assoc. LLP","bank_name":"Wells Fargo","routing_number":"121000248","account_number_masked":"•••• 8820"}'::jsonb, 'active'),
  ('a0000000-0000-0000-0000-0000000000e4'::uuid, 'Meridian Media',  '11111111-1111-1111-1111-111111111102', 'ach',
   '{"gl_account_id":"33333333-3333-3333-3333-333333333304","department_id":"44444444-4444-4444-4444-444444444402","class_id":"55555555-5555-5555-5555-555555555501","location_id":"66666666-6666-6666-6666-666666666602","custom_dimension_id":"77777777-7777-7777-7777-777777777701","billable":true}'::jsonb,
   '{"account_holder":"Meridian Media LLC","bank_name":"Citibank","routing_number":"021000089","account_number_masked":"•••• 1174"}'::jsonb, 'active'),
  ('a0000000-0000-0000-0000-0000000000e5'::uuid, 'Northwind Freight','11111111-1111-1111-1111-111111111103', 'check',
   null, null, 'inactive');

-- ---------------------------------------------------------------------------
-- Bills — one per lifecycle state (plus extras) so every tab has content.
-- created_by rotates through the AP users; amounts are cents.
-- ---------------------------------------------------------------------------
insert into bills (id, vendor_id, entity_id, created_by, source, invoice_number, invoice_date, due_date, accounting_date, po_number, amount_cents, currency, memo, document_url, status) values
  -- draft (manual entry, fully coded, ready to submit)
  ('b0000000-0000-0000-0000-00000000d001'::uuid, 'a0000000-0000-0000-0000-0000000000e1'::uuid, '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'manual', 'WBM-4471', '2026-06-20', '2026-07-20', '2026-06-30', null, 128900, 'USD', 'Q2 office supplies', null, 'draft'),
  -- missing_info (email-ingested, VENDOR-LESS — the whole point of nullable vendor_id)
  ('b0000000-0000-0000-0000-00000000d002'::uuid, null,                                          null,                                   '11111111-1111-1111-1111-111111111102', 'email',  null,       null,        '2026-07-01', null, null,   45000,  'USD', 'Forwarded invoice — vendor not matched yet', 'https://demo.local/inbox/45a1.pdf', 'missing_info'),
  -- awaiting_approval (over the routing threshold; has an approval chain + AI review)
  ('b0000000-0000-0000-0000-00000000d003'::uuid, 'a0000000-0000-0000-0000-0000000000e3'::uuid, '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111103', 'upload', 'AL-2026-88', '2026-06-15', '2026-07-15', '2026-06-30', 'PO-5521', 1250000, 'USD', 'Contract review retainer', 'https://demo.local/inv/al88.pdf', 'awaiting_approval'),
  -- approved (cleared the chain; waiting to be scheduled)
  ('b0000000-0000-0000-0000-00000000d004'::uuid, 'a0000000-0000-0000-0000-0000000000e2'::uuid, '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111103', 'email',  'FIG-99201', '2026-06-25', '2026-07-10', '2026-06-30', null, 90000,  'USD', 'Figma annual seats', null, 'approved'),
  -- scheduled (payment scheduled, not yet paid)
  ('b0000000-0000-0000-0000-00000000d005'::uuid, 'a0000000-0000-0000-0000-0000000000e4'::uuid, '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'upload', 'MM-3310', '2026-06-10', '2026-07-05', '2026-06-30', null, 340000, 'USD', 'June campaign — billable to Project Atlas', 'https://demo.local/inv/mm3310.pdf', 'scheduled'),
  -- partially_paid (one of two installments cleared)
  ('b0000000-0000-0000-0000-00000000d006'::uuid, 'a0000000-0000-0000-0000-0000000000e3'::uuid, '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111103', 'manual', 'AL-2026-71', '2026-05-30', '2026-07-30', '2026-05-31', null, 800000, 'USD', 'Litigation support — 2 installments', null, 'partially_paid'),
  -- paid (settled end-to-end)
  ('b0000000-0000-0000-0000-00000000d007'::uuid, 'a0000000-0000-0000-0000-0000000000e1'::uuid, '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'manual', 'WBM-4390', '2026-05-12', '2026-06-12', '2026-05-31', null, 61200,  'USD', 'May supplies', null, 'paid'),
  -- rejected (an approver sent it back)
  ('b0000000-0000-0000-0000-00000000d008'::uuid, 'a0000000-0000-0000-0000-0000000000e4'::uuid, '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111103', 'upload', 'MM-3288', '2026-05-20', '2026-06-20', '2026-05-31', null, 275000, 'USD', 'Disputed — rejected pending clarification', 'https://demo.local/inv/mm3288.pdf', 'rejected'),
  -- archived (terminal)
  ('b0000000-0000-0000-0000-00000000d009'::uuid, 'a0000000-0000-0000-0000-0000000000e5'::uuid, '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'manual', 'NW-1102', '2026-04-01', '2026-05-01', '2026-04-30', null, 52000,  'USD', 'Old freight bill — archived', null, 'archived'),
  -- a second awaiting_approval carrying a DUPLICATE + overbilling flag (the red ↳ rows)
  ('b0000000-0000-0000-0000-00000000d010'::uuid, 'a0000000-0000-0000-0000-0000000000e1'::uuid, '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'email',  'WBM-4471', '2026-06-20', '2026-07-20', '2026-06-30', null, 128900, 'USD', 'Looks like a re-forward of WBM-4471', 'https://demo.local/inbox/dup.pdf', 'awaiting_approval');

-- ---------------------------------------------------------------------------
-- Risk flags (bills.ts → BillFlagSchema) — the red ↳ annotation rows.
-- ---------------------------------------------------------------------------
insert into bill_flags (id, bill_id, type, message, related_bill_id, amount_cents, dismissed) values
  ('c0000000-0000-0000-0000-00000000f001'::uuid, 'b0000000-0000-0000-0000-00000000d010'::uuid, 'duplicate',   'Possible duplicate of INV# WBM-4471', 'b0000000-0000-0000-0000-00000000d001'::uuid, null,   false),
  ('c0000000-0000-0000-0000-00000000f002'::uuid, 'b0000000-0000-0000-0000-00000000d008'::uuid, 'overbilling', 'Ramp identified $566.00 of overbilling for this invoice', null, 56600, false);

-- ---------------------------------------------------------------------------
-- Line items (bills.ts → BillLineItemSchema) — coding at the LINE level.
-- A couple of bills get real lines (incl. an item line + a split pair).
-- ---------------------------------------------------------------------------
-- draft d001: two expense lines, vendor-default coding
insert into bill_line_items (id, bill_id, line_no, kind, description, qty, unit_price_cents, amount_cents, gl_account_id, department_id, class_id, location_id, tax_code_id, custom_dimension_id, billable, coding_source, split_group_id) values
  ('d1000000-0000-0000-0000-000000001001'::uuid, 'b0000000-0000-0000-0000-00000000d001'::uuid, 1, 'expense', 'Paper & toner', null, null, 89900, '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444403', '55555555-5555-5555-5555-555555555502', '66666666-6666-6666-6666-666666666601', '88888888-8888-8888-8888-888888888801', null, false, 'vendor_default', null),
  ('d1000000-0000-0000-0000-000000001002'::uuid, 'b0000000-0000-0000-0000-00000000d001'::uuid, 2, 'expense', 'Breakroom supplies', null, null, 39000, '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444403', '55555555-5555-5555-5555-555555555502', '66666666-6666-6666-6666-666666666601', '88888888-8888-8888-8888-888888888801', null, false, 'user', null);

-- scheduled d005: one item line (qty × unit) coded by Ramp, billable to Project Atlas
insert into bill_line_items (id, bill_id, line_no, kind, description, qty, unit_price_cents, amount_cents, gl_account_id, department_id, class_id, location_id, tax_code_id, custom_dimension_id, billable, coding_source, split_group_id) values
  ('d1000000-0000-0000-0000-000000001003'::uuid, 'b0000000-0000-0000-0000-00000000d005'::uuid, 1, 'item', 'Sponsored placements', 4, 85000, 340000, '33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444402', '55555555-5555-5555-5555-555555555501', '66666666-6666-6666-6666-666666666602', '88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777701', true, 'ramp', null);

-- awaiting d003: a SPLIT — one $12,500 retainer split across two departments
-- (sibling rows sharing split_group_id; no separate distribution table).
insert into bill_line_items (id, bill_id, line_no, kind, description, qty, unit_price_cents, amount_cents, gl_account_id, department_id, class_id, location_id, tax_code_id, custom_dimension_id, billable, coding_source, split_group_id) values
  ('d1000000-0000-0000-0000-000000001004'::uuid, 'b0000000-0000-0000-0000-00000000d003'::uuid, 1, 'expense', 'Legal retainer (Engineering share)', null, null, 750000, '33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444401', '55555555-5555-5555-5555-555555555502', '66666666-6666-6666-6666-666666666601', '88888888-8888-8888-8888-888888888801', null, false, 'user', 'e1000000-0000-0000-0000-0000000000a1'::uuid),
  ('d1000000-0000-0000-0000-000000001005'::uuid, 'b0000000-0000-0000-0000-00000000d003'::uuid, 2, 'expense', 'Legal retainer (Ops share)',         null, null, 500000, '33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444403', '55555555-5555-5555-5555-555555555502', '66666666-6666-6666-6666-666666666601', '88888888-8888-8888-8888-888888888801', null, false, 'user', 'e1000000-0000-0000-0000-0000000000a1'::uuid);

-- ---------------------------------------------------------------------------
-- Approval policies (approvals.ts → ApprovalPolicySchema) — admin-configured
-- routing. Exactly one target per step (CHECK enforces it).
-- ---------------------------------------------------------------------------
insert into approval_policies (id, min_amount_cents, approver_id, approver_role, approver_dynamic, allow_self_approve, sequence) values
  -- anything ≥ $1,000 hits an Admin first
  ('f0000000-0000-0000-0000-0000000000b1'::uuid, 100000,  null, 'admin', null,           false, 1),
  -- large bills (≥ $10,000) additionally route to the Vendor Owner
  ('f0000000-0000-0000-0000-0000000000b2'::uuid, 1000000, null, null,   'vendor_owner',  false, 2);

-- ---------------------------------------------------------------------------
-- Materialized approval chains (approvals.ts → ApprovalSchema)
-- ---------------------------------------------------------------------------
-- d003 (awaiting): step 1 pending with Priya (admin), step 2 pending vendor owner (Priya owns Anderson Legal)
insert into approvals (id, bill_id, approver_id, sequence, status, comment, acted_at) values
  ('e0000000-0000-0000-0000-0000000000a1'::uuid, 'b0000000-0000-0000-0000-00000000d003'::uuid, '11111111-1111-1111-1111-111111111101', 1, 'pending',  null, null),
  ('e0000000-0000-0000-0000-0000000000a2'::uuid, 'b0000000-0000-0000-0000-00000000d003'::uuid, '11111111-1111-1111-1111-111111111104', 2, 'pending',  null, null),
  -- d004 (approved): the chain cleared
  ('e0000000-0000-0000-0000-0000000000a3'::uuid, 'b0000000-0000-0000-0000-00000000d004'::uuid, '11111111-1111-1111-1111-111111111101', 1, 'approved', 'Looks good', '2026-06-26T15:04:00Z'),
  -- d008 (rejected): sent back with a reason (rejection requires a comment)
  ('e0000000-0000-0000-0000-0000000000a4'::uuid, 'b0000000-0000-0000-0000-00000000d008'::uuid, '11111111-1111-1111-1111-111111111101', 1, 'rejected', 'Amount exceeds the quote — please confirm with the vendor', '2026-05-22T09:30:00Z');

-- ---------------------------------------------------------------------------
-- Approval STAGES (the snapshot-10 chain editor grain — 0005_approval_stages).
-- The editable route BEFORE materialization: each stage is roles ∪ users. d001
-- (a draft) carries a two-step route so the editor opens on real data — step 1
-- the "Any Admin" role group, step 2 a hand-picked user (Hannah).
-- ---------------------------------------------------------------------------
insert into approval_stages (id, bill_id, sequence) values
  ('c0000000-0000-0000-0000-0000000000a1'::uuid, 'b0000000-0000-0000-0000-00000000d001'::uuid, 1),
  ('c0000000-0000-0000-0000-0000000000a2'::uuid, 'b0000000-0000-0000-0000-00000000d001'::uuid, 2);

insert into approval_stage_roles (stage_id, role) values
  ('c0000000-0000-0000-0000-0000000000a1'::uuid, 'admin');

insert into approval_stage_users (stage_id, user_id) values
  ('c0000000-0000-0000-0000-0000000000a2'::uuid, '11111111-1111-1111-1111-111111111109'::uuid);

-- ---------------------------------------------------------------------------
-- AI pre-reviews (approvals.ts → BillReviewSchema). "ready_to_approve" iff all
-- checks pass; d003 has a failing check → review_recommended.
-- ---------------------------------------------------------------------------
insert into bill_reviews (bill_id, verdict, checks, created_at) values
  ('b0000000-0000-0000-0000-00000000d003'::uuid, 'review_recommended',
   '[{"label":"Bill amount is similar to recent Anderson Legal bills","passed":true,"detail":null},{"label":"No duplicate detected","passed":true,"detail":null},{"label":"Coding is complete","passed":false,"detail":"Split lines are missing a tax code review"}]'::jsonb,
   '2026-06-16T12:00:00Z'),
  ('b0000000-0000-0000-0000-00000000d004'::uuid, 'ready_to_approve',
   '[{"label":"Bill amount is similar to recent Figma bills","passed":true,"detail":null},{"label":"No duplicate detected","passed":true,"detail":null},{"label":"Coding is complete","passed":true,"detail":null}]'::jsonb,
   '2026-06-25T18:20:00Z');

-- ---------------------------------------------------------------------------
-- Payment batches (payments.ts → PaymentBatchSchema)
-- ---------------------------------------------------------------------------
insert into payment_batches (id, created_by, status, released_at) values
  ('a1000000-0000-0000-0000-0000000000b1'::uuid, '11111111-1111-1111-1111-111111111102', 'released', '2026-06-13T17:00:00Z');

-- ---------------------------------------------------------------------------
-- Payments (payments.ts → PaymentSchema). One FAILED payment demonstrates the
-- rule: a failure sends the BILL back to `approved` (d004 above is that bill),
-- and recovery is a NEW payment, never a resurrected row.
-- ---------------------------------------------------------------------------
insert into payments (id, bill_id, method, account_id, amount_cents, scheduled_date, arrival_date, batch_id, status, failure_reason) values
  -- d005 scheduled: an ACH scheduled, not yet moved
  ('a2000000-0000-0000-0000-0000000000c1'::uuid, 'b0000000-0000-0000-0000-00000000d005'::uuid, 'ach', '99999999-9999-9999-9999-999999999901', 340000, '2026-07-03', '2026-07-07', null, 'scheduled', null),
  -- d006 partially_paid: installment 1 paid, installment 2 scheduled
  ('a2000000-0000-0000-0000-0000000000c2'::uuid, 'b0000000-0000-0000-0000-00000000d006'::uuid, 'wire', '99999999-9999-9999-9999-999999999901', 400000, '2026-06-15', '2026-06-16', null, 'paid',      null),
  ('a2000000-0000-0000-0000-0000000000c3'::uuid, 'b0000000-0000-0000-0000-00000000d006'::uuid, 'wire', '99999999-9999-9999-9999-999999999901', 400000, '2026-07-15', null,         null, 'scheduled', null),
  -- d007 paid: settled via a released batch
  ('a2000000-0000-0000-0000-0000000000c4'::uuid, 'b0000000-0000-0000-0000-00000000d007'::uuid, 'ach', '99999999-9999-9999-9999-999999999901', 61200,  '2026-06-12', '2026-06-14', 'a1000000-0000-0000-0000-0000000000b1'::uuid, 'paid', null),
  -- d004 approved: its FIRST payment FAILED — that's why the bill is back at approved
  ('a2000000-0000-0000-0000-0000000000c5'::uuid, 'b0000000-0000-0000-0000-00000000d004'::uuid, 'card', null, 90000, '2026-06-28', null, null, 'failed', 'Card authorization declined by issuer');

-- ---------------------------------------------------------------------------
-- Virtual cards (payments.ts → VirtualCardSchema) — the card rail. d004's card
-- locked after its (failed) charge attempt.
-- ---------------------------------------------------------------------------
insert into virtual_cards (id, bill_id, payment_id, last4, amount_cents, delivery, memo, single_use, status) values
  ('a3000000-0000-0000-0000-0000000000c1'::uuid, 'b0000000-0000-0000-0000-00000000d004'::uuid, 'a2000000-0000-0000-0000-0000000000c5'::uuid, '4417', 90000, 'auto_pay', 'Figma annual — INV FIG-99201', true, 'locked');

-- ---------------------------------------------------------------------------
-- Activity events (activity.ts → ActivityEventSchema) — the audit trail. A
-- representative slice; null actor = the system (autocode, phantom approvers).
-- ---------------------------------------------------------------------------
insert into activity_events (id, bill_id, actor_id, type, payload, created_at) values
  ('a4000000-0000-0000-0000-0000000000e1'::uuid, 'b0000000-0000-0000-0000-00000000d002'::uuid, null,                                     'bill_created',           '{"source":"email"}'::jsonb, '2026-07-01T08:00:00Z'),
  ('a4000000-0000-0000-0000-0000000000e2'::uuid, 'b0000000-0000-0000-0000-00000000d010'::uuid, null,                                     'bill_flagged',           '{"type":"duplicate","related":"WBM-4471"}'::jsonb, '2026-06-21T09:12:00Z'),
  ('a4000000-0000-0000-0000-0000000000e3'::uuid, 'b0000000-0000-0000-0000-00000000d005'::uuid, null,                                     'coding_suggested',       '{"by":"ramp","lines":1}'::jsonb, '2026-06-11T10:00:00Z'),
  ('a4000000-0000-0000-0000-0000000000e4'::uuid, 'b0000000-0000-0000-0000-00000000d004'::uuid, '11111111-1111-1111-1111-111111111101',   'approval_approved',      '{"sequence":1}'::jsonb, '2026-06-26T15:04:00Z'),
  ('a4000000-0000-0000-0000-0000000000e5'::uuid, 'b0000000-0000-0000-0000-00000000d004'::uuid, null,                                     'payment_failed',         '{"reason":"Card authorization declined by issuer"}'::jsonb, '2026-06-28T13:45:00Z'),
  ('a4000000-0000-0000-0000-0000000000e6'::uuid, 'b0000000-0000-0000-0000-00000000d004'::uuid, null,                                     'bill_status_changed',    '{"from":"scheduled","to":"approved"}'::jsonb, '2026-06-28T13:45:01Z'),
  ('a4000000-0000-0000-0000-0000000000e7'::uuid, 'b0000000-0000-0000-0000-00000000d007'::uuid, null,                                     'payment_batch_released', '{"batch":"a1000000-0000-0000-0000-0000000000b1"}'::jsonb, '2026-06-13T17:00:00Z'),
  ('a4000000-0000-0000-0000-0000000000e8'::uuid, 'b0000000-0000-0000-0000-00000000d008'::uuid, '11111111-1111-1111-1111-111111111101',   'approval_rejected',      '{"comment":"Amount exceeds the quote"}'::jsonb, '2026-05-22T09:30:00Z');

-- ---------------------------------------------------------------------------
-- Bill Pay tabs (bill-tabs.ts → BillTabSchema) — the five product categories
-- as data. `code` is the `?tab=` slug; `statuses` is the group it rolls up
-- ({} = unfiltered Overview). Ids are pinned so the seed stays deterministic.
-- Deliberate gap: rejected/archived belong to no named tab — they surface only
-- under Overview's unfiltered whole.
-- ---------------------------------------------------------------------------
-- The five seeded categories are SYSTEM tabs: created_by is NULL (no owner),
-- which is what marks them undeletable ahead of the custom-views feature.
insert into bill_tabs (id, name, code, statuses, sort_order, created_by) values
  ('99999999-9999-9999-9999-999999999901'::uuid, 'Overview',     'overview',     '{}'::bill_status[],                                  0, null),
  ('99999999-9999-9999-9999-999999999902'::uuid, 'Drafts',       'drafts',       '{draft,missing_info}'::bill_status[],                1, null),
  ('99999999-9999-9999-9999-999999999903'::uuid, 'For approval', 'for_approval', '{awaiting_approval}'::bill_status[],                 2, null),
  ('99999999-9999-9999-9999-999999999904'::uuid, 'For payment',  'for_payment',  '{approved,scheduled,partially_paid}'::bill_status[], 3, null),
  ('99999999-9999-9999-9999-999999999905'::uuid, 'History',      'history',      '{paid}'::bill_status[],                              4, null);

commit;
