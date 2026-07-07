-- ramps — approval STAGES (the snapshot-10 chain editor grain)
--
-- The Approvals block builds an ordered chain where each STEP is a compound of
-- role groups ("Any Admin") AND/OR hand-picked users — the DS ApprovalsWorkflow
-- model. The existing `approvals` table is the MATERIALIZED, status-bearing
-- chain (one concrete row per person, the N-of-M counter); it cannot represent
-- a role step or the "this was a role" intent. So stages get their own grain:
--
--   approval_stages       — one row per step (bill + sequence)
--   approval_stage_roles  — the role picks for a step (0..n; role enum)
--   approval_stage_users  — the individually-picked users for a step (0..n)
--
-- A step is roles ∪ users; the app enforces one-role-per-chain and the
-- role↔user dedup (the DS component already does). `approvals` stays as-is: on
-- submit the stages materialize into `approvals` rows to be acted on.
--
-- RLS: enabled with no policies, mirroring every other table — the server talks
-- to Postgres with the secret key (bypasses RLS); the anon surface stays locked.

begin;

-- One step of a bill's approval route. `sequence` is 1-based and unique per
-- bill so the chain reads 1…N; reorder rewrites these. Cascade on the bill so a
-- deleted draft takes its route with it.
create table approval_stages (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills (id) on delete cascade,
  sequence integer not null check (sequence >= 1),
  unique (bill_id, sequence)
);
create index approval_stages_bill_idx on approval_stages (bill_id, sequence);

-- The role groups checked for a step. A role appears at most once per stage
-- (PK); one-role-per-CHAIN is an app invariant (the picker hides used roles).
create table approval_stage_roles (
  stage_id uuid not null references approval_stages (id) on delete cascade,
  role role not null,
  primary key (stage_id, role)
);

-- The individual users checked for a step (beyond anyone a role already covers).
create table approval_stage_users (
  stage_id uuid not null references approval_stages (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  primary key (stage_id, user_id)
);

alter table approval_stages enable row level security;
alter table approval_stage_roles enable row level security;
alter table approval_stage_users enable row level security;

commit;
