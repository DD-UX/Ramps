-- ramps — core schema (0001)
--
-- The database mirror of the zod single source of truth in @ramps/schemas
-- (ANALYSIS §4 contract flow: enums/tables/constraints track the zod shapes in
-- lockstep). Every enum below is the SAME set of values as its z.enum(); every
-- money column is integer cents; ids are uuid; dates are `date`, timestamps are
-- `timestamptz`. The DB defends itself with CHECK constraints and enums even if
-- app code slips (ANALYSIS §4 design notes).
--
-- Append-only: later migrations add, never rewrite this file.

begin;

-- ---------------------------------------------------------------------------
-- Enums — each mirrors a z.enum() in packages/schemas
-- ---------------------------------------------------------------------------

-- policies.ts → RoleSchema
create type role as enum ('admin', 'accounts_payable', 'employee');

-- policies.ts → PolicyKeySchema
create type policy_key as enum (
  'employee.all',
  'billpay.view',
  'bill.create',
  'bill.submit',
  'bill.edit',
  'bill.approve',
  'bill.pay',
  'vendor.view',
  'vendor.manage',
  'payment.view',
  'policy.manage',
  'user.manage'
);

-- policies.ts → UserPolicyOverrideSchema.mode
create type policy_override_mode as enum ('include', 'exclude');

-- vendors.ts → VendorStatusSchema
create type vendor_status as enum ('active', 'inactive');

-- payments.ts → PaymentMethodSchema (also vendors.default_payment_method)
create type payment_method as enum ('ach', 'check', 'wire', 'card');

-- payments.ts → PaymentStatusSchema
create type payment_status as enum ('scheduled', 'initiated', 'paid', 'failed');

-- payments.ts → VirtualCardDeliverySchema
create type virtual_card_delivery as enum ('auto_pay', 'send_to_vendor', 'use_myself');

-- payments.ts → VirtualCardStatusSchema
create type virtual_card_status as enum ('active', 'locked');

-- payments.ts → PaymentBatchStatusSchema
create type payment_batch_status as enum ('pending_release', 'released');

-- dimensions.ts → DimensionSourceSchema
create type dimension_source as enum ('quickbooks', 'netsuite', 'sage', 'xero', 'seed');

-- bills.ts → BillSourceSchema
create type bill_source as enum ('email', 'upload', 'spreadsheet', 'manual');

-- bills.ts → BillStatusSchema (the 9-state lifecycle)
create type bill_status as enum (
  'draft',
  'missing_info',
  'awaiting_approval',
  'approved',
  'scheduled',
  'partially_paid',
  'paid',
  'rejected',
  'archived'
);

-- bills.ts → BillFlagTypeSchema
create type bill_flag_type as enum ('overbilling', 'duplicate', 'fraud');

-- bills.ts → LineItemKindSchema
create type line_item_kind as enum ('expense', 'item');

-- bills.ts → CodingSourceSchema
create type coding_source as enum ('ramp', 'vendor_default', 'user');

-- approvals.ts → ApprovalDynamicTargetSchema
create type approval_dynamic_target as enum ('vendor_owner');

-- approvals.ts → ApprovalStatusSchema
create type approval_status as enum ('pending', 'approved', 'rejected');

-- approvals.ts → BillReviewVerdictSchema
create type bill_review_verdict as enum ('ready_to_approve', 'review_recommended');

-- activity.ts → ActivityEventTypeSchema
create type activity_event_type as enum (
  'bill_created',
  'bill_updated',
  'bill_status_changed',
  'approval_requested',
  'approval_approved',
  'approval_rejected',
  'approver_added',
  'payment_scheduled',
  'payment_initiated',
  'payment_paid',
  'payment_failed',
  'payment_batch_released',
  'bill_flagged',
  'flag_dismissed',
  'coding_suggested',
  'default_coding_saved',
  'context_added',
  'virtual_card_created',
  'virtual_card_locked',
  'comment_added',
  'reminder_sent'
);

-- ---------------------------------------------------------------------------
-- Identity & permissions
-- ---------------------------------------------------------------------------

-- users.ts → UserSchema
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) >= 1),
  email text not null unique,
  role role not null,
  -- avatar_url nullable → render initials when null
  avatar_url text
);

-- policies.ts → the catalog table (PolicyKeySchema is the SSoT; the row set
-- equals the enum's members, seeded in seed.sql).
create table policies (
  key policy_key primary key
);

-- policies.ts → ROLE_POLICIES (role → policies it sums to)
create table role_policies (
  role role not null,
  policy_key policy_key not null references policies (key),
  primary key (role, policy_key)
);

-- policies.ts → UserPolicyOverrideSchema (per-user +/-, exclude wins in
-- effectivePolicies(); the app computes it, the table just stores the deltas).
create table user_policy_overrides (
  user_id uuid not null references users (id) on delete cascade,
  policy_key policy_key not null references policies (key),
  mode policy_override_mode not null,
  primary key (user_id, policy_key)
);

-- ---------------------------------------------------------------------------
-- Accounting dimensions (dimensions.ts) — local reference tables with the
-- external_id + source integration seam.
-- ---------------------------------------------------------------------------

-- dimensions.ts → GlAccountSchema
create table gl_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) >= 1),
  code text not null check (length(code) >= 1),
  category text not null check (length(category) >= 1),
  type text not null check (length(type) >= 1),
  active boolean not null,
  external_id text,
  source dimension_source not null
);

-- dimensions.ts → DepartmentSchema
create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) >= 1),
  code text not null check (length(code) >= 1),
  active boolean not null,
  external_id text,
  source dimension_source not null
);

-- dimensions.ts → ClassSchema
create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) >= 1),
  code text not null check (length(code) >= 1),
  active boolean not null,
  external_id text,
  source dimension_source not null
);

-- dimensions.ts → LocationSchema
create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) >= 1),
  code text not null check (length(code) >= 1),
  active boolean not null,
  external_id text,
  source dimension_source not null
);

-- dimensions.ts → CustomDimensionSchema (field names the NetSuite-style segment)
create table custom_dimensions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) >= 1),
  code text not null check (length(code) >= 1),
  field text not null check (length(field) >= 1),
  active boolean not null,
  external_id text,
  source dimension_source not null
);

-- dimensions.ts → TaxCodeSchema (rate in integer basis points, never a float)
create table tax_codes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) >= 1),
  rate_bps integer not null check (rate_bps >= 0),
  active boolean not null,
  external_id text,
  source dimension_source not null
);

-- ---------------------------------------------------------------------------
-- Payment accounts (payments.ts → PaymentAccountSchema) — the "Pay from"
-- picker's bank accounts with simulated live balances.
-- ---------------------------------------------------------------------------
create table payment_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) >= 1),
  bank_name text not null check (length(bank_name) >= 1),
  account_number_masked text not null check (length(account_number_masked) >= 1),
  balance_cents bigint not null
);

-- ---------------------------------------------------------------------------
-- Entities (bills.ts → EntitySchema) — the "Create bill under" legal entity.
-- ---------------------------------------------------------------------------
create table entities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) >= 1)
);

-- ---------------------------------------------------------------------------
-- Vendors (vendors.ts → VendorSchema). default_coding + bank_details are
-- nested objects in zod; stored as jsonb here (validated at the boundary by
-- VendorDefaultCodingSchema / VendorBankDetailsSchema).
-- ---------------------------------------------------------------------------
create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) >= 1),
  owner_id uuid not null references users (id),
  default_payment_method payment_method,
  default_coding jsonb,
  bank_details jsonb,
  status vendor_status not null default 'active'
);

-- ---------------------------------------------------------------------------
-- Bills (bills.ts → BillSchema) — the OBLIGATION side of the split.
-- vendor_id is NULLABLE by design: the email door lands drafts before a vendor
-- is matched; the submit transition (app-side) requires it, not the column.
-- ---------------------------------------------------------------------------
create table bills (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors (id),
  entity_id uuid references entities (id),
  created_by uuid not null references users (id),
  source bill_source not null,
  invoice_number text,
  invoice_date date,
  due_date date,
  accounting_date date,
  po_number text,
  amount_cents bigint not null,
  currency text not null default 'USD' check (length(currency) = 3),
  memo text,
  document_url text,
  status bill_status not null default 'draft'
);
create index bills_status_idx on bills (status);
create index bills_vendor_idx on bills (vendor_id);

-- bills.ts → BillFlagSchema (the red ↳ annotation rows: overbilling/duplicate/fraud)
create table bill_flags (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills (id) on delete cascade,
  type bill_flag_type not null,
  message text not null check (length(message) >= 1),
  -- duplicates point at the original bill; other flags may not
  related_bill_id uuid references bills (id),
  -- overbilling flags carry the disputed amount
  amount_cents bigint,
  dismissed boolean not null default false
);
create index bill_flags_bill_idx on bill_flags (bill_id);

-- bills.ts → BillLineItemSchema. Coding lives at the LINE level; a split is N
-- sibling rows sharing split_group_id (no separate GL-distribution table).
create table bill_line_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills (id) on delete cascade,
  line_no integer not null check (line_no >= 1),
  kind line_item_kind not null,
  description text not null,
  -- item lines carry qty/unit price; expense lines leave them null
  qty integer check (qty > 0),
  unit_price_cents bigint,
  amount_cents bigint not null,
  gl_account_id uuid references gl_accounts (id),
  department_id uuid references departments (id),
  class_id uuid references classes (id),
  location_id uuid references locations (id),
  tax_code_id uuid references tax_codes (id),
  custom_dimension_id uuid references custom_dimensions (id),
  billable boolean not null default false,
  coding_source coding_source,
  split_group_id uuid,
  unique (bill_id, line_no)
);
create index bill_line_items_bill_idx on bill_line_items (bill_id);

-- ---------------------------------------------------------------------------
-- Approvals (approvals.ts)
-- ---------------------------------------------------------------------------

-- ApprovalPolicySchema — a step names EXACTLY ONE of approver_id / approver_role
-- / approver_dynamic (the zod .refine(); enforced here by a CHECK on the count
-- of non-null targets).
create table approval_policies (
  id uuid primary key default gen_random_uuid(),
  min_amount_cents bigint not null check (min_amount_cents >= 0),
  approver_id uuid references users (id),
  approver_role role,
  approver_dynamic approval_dynamic_target,
  allow_self_approve boolean not null default false,
  sequence integer not null check (sequence >= 1),
  constraint approval_policy_exactly_one_target check (
    (approver_id is not null)::int
    + (approver_role is not null)::int
    + (approver_dynamic is not null)::int = 1
  )
);

-- ApprovalSchema — one materialized step of a bill's chain (the N-of-M counter).
create table approvals (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills (id) on delete cascade,
  approver_id uuid not null references users (id),
  sequence integer not null check (sequence >= 1),
  status approval_status not null default 'pending',
  comment text,
  acted_at timestamptz,
  unique (bill_id, sequence)
);
create index approvals_bill_idx on approvals (bill_id);
create index approvals_approver_idx on approvals (approver_id);

-- BillReviewSchema — the AI pre-review (verdict + checks). "ready_to_approve"
-- iff every check passed; the checks array lives in jsonb. The iff invariant is
-- enforced at the app boundary (it quantifies over the jsonb array).
create table bill_reviews (
  bill_id uuid primary key references bills (id) on delete cascade,
  verdict bill_review_verdict not null,
  checks jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Payments (payments.ts) — the MONEY-MOVEMENT side of the split.
-- ---------------------------------------------------------------------------

-- PaymentBatchSchema — the bulk "Release payments" event.
create table payment_batches (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references users (id),
  status payment_batch_status not null default 'pending_release',
  released_at timestamptz
);

-- PaymentSchema. One bill → many payments; failed is terminal (recovery is a
-- NEW payment, the bill returns to approved — enforced app-side by the
-- transition maps). account_id null on the card rail.
create table payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills (id) on delete cascade,
  method payment_method not null,
  account_id uuid references payment_accounts (id),
  amount_cents bigint not null,
  scheduled_date date not null,
  arrival_date date,
  batch_id uuid references payment_batches (id),
  status payment_status not null default 'scheduled',
  failure_reason text
);
create index payments_bill_idx on payments (bill_id);
create index payments_status_idx on payments (status);

-- VirtualCardSchema — the card rail: a single-use card minted for a bill.
create table virtual_cards (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills (id) on delete cascade,
  payment_id uuid references payments (id),
  last4 text not null check (length(last4) = 4),
  amount_cents bigint not null,
  delivery virtual_card_delivery not null,
  memo text,
  single_use boolean not null default true,
  status virtual_card_status not null default 'active'
);
create index virtual_cards_bill_idx on virtual_cards (bill_id);

-- ---------------------------------------------------------------------------
-- Activity events (activity.ts → ActivityEventSchema) — the append-only audit
-- trail from day one. Null actor = the system. payload is event-specific jsonb.
-- ---------------------------------------------------------------------------
create table activity_events (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills (id) on delete cascade,
  actor_id uuid references users (id),
  type activity_event_type not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_events_bill_idx on activity_events (bill_id, created_at);

commit;
