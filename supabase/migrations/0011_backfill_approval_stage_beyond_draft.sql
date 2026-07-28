-- ramps — backfill: every bill PAST the pre-submit states gets an approval route.
--
-- Approvals are now REQUIRED to submit (the SDK's submitBill refuses an empty
-- `approval_stages` route), so the seeded bills that predate the rule must not
-- sit beyond draft/missing_info with nobody on their chain. Any such bill gains
-- a single stage — sequence 1, the "Any Admin" role group — matching the seed
-- convention (0009 routed the awaiting bills to an admin at sequence 1) and the
-- most neutral choice: a role group, not a named person the data never picked.
--
-- Pre-submit bills (`draft` / `missing_info`) are deliberately untouched: their
-- authors still choose the route; the submit gate is what enforces it.
--
-- Idempotent BY BILL, not by row id: the guard is "has no stage at all", so a
-- re-run (or a bill that meanwhile gained a route) inserts nothing. The stage
-- ids are generated, and the role rows attach via the same CTE so the two
-- inserts can't drift.

begin;

with missing as (
  select b.id as bill_id
  from public.bills b
  where b.status not in ('draft', 'missing_info')
    and not exists (
      select 1 from public.approval_stages s where s.bill_id = b.id
    )
),
inserted as (
  insert into public.approval_stages (id, bill_id, sequence)
  select gen_random_uuid(), m.bill_id, 1
  from missing m
  returning id
)
insert into public.approval_stage_roles (stage_id, role)
select i.id, 'admin'::role
from inserted i;

commit;
