-- Downstream rows so the new beyond-draft bills render coherently.
-- account: Operating Checking 9999...901. Guarded by id → idempotent.

-- Payments -----------------------------------------------------------------
insert into public.payments
  (id, bill_id, method, account_id, amount_cents, scheduled_date, arrival_date, batch_id, status, failure_reason)
select v.* from (values
  -- d107 scheduled · Figma $2,100 (ach, upcoming)
  ('d1000000-0000-0000-0000-00000000d107'::uuid, 'b0000000-0000-0000-0000-00000000d107'::uuid, 'ach'::payment_method,
   '99999999-9999-9999-9999-999999999901'::uuid, 210000::bigint, '2026-07-14'::date, null::date, null::uuid, 'scheduled'::payment_status, null::text),
  -- d108 partially_paid · Anderson Legal $6,000 → one paid, one scheduled
  ('d1000000-0000-0000-0000-00000000d181'::uuid, 'b0000000-0000-0000-0000-00000000d108'::uuid, 'wire',
   '99999999-9999-9999-9999-999999999901'::uuid, 300000, '2026-06-20', '2026-06-23', null, 'paid', null),
  ('d1000000-0000-0000-0000-00000000d182'::uuid, 'b0000000-0000-0000-0000-00000000d108'::uuid, 'wire',
   '99999999-9999-9999-9999-999999999901'::uuid, 300000, '2026-08-01', null, null, 'scheduled', null),
  -- d109 paid · W.B. Mason $1,150 (ach)
  ('d1000000-0000-0000-0000-00000000d109'::uuid, 'b0000000-0000-0000-0000-00000000d109'::uuid, 'ach',
   '99999999-9999-9999-9999-999999999901'::uuid, 115000, '2026-06-16', '2026-06-18', null, 'paid', null),
  -- d110 paid · Meridian Media $4,200 (ach)
  ('d1000000-0000-0000-0000-00000000d110'::uuid, 'b0000000-0000-0000-0000-00000000d110'::uuid, 'ach',
   '99999999-9999-9999-9999-999999999901'::uuid, 420000, '2026-06-08', '2026-06-10', null, 'paid', null)
) as v(id, bill_id, method, account_id, amount_cents, scheduled_date, arrival_date, batch_id, status, failure_reason)
where not exists (select 1 from public.payments p where p.id = v.id);

-- Approvals (pending) for the two awaiting_approval bills --------------------
-- approver: Priya Nair 1111...104 (admin) at sequence 1
insert into public.approvals (id, bill_id, approver_id, sequence, status, comment, acted_at)
select v.* from (values
  ('e1000000-0000-0000-0000-00000000d103'::uuid, 'b0000000-0000-0000-0000-00000000d103'::uuid,
   '11111111-1111-1111-1111-111111111104'::uuid, 1, 'pending'::approval_status, null::text, null::timestamptz),
  ('e1000000-0000-0000-0000-00000000d104'::uuid, 'b0000000-0000-0000-0000-00000000d104'::uuid,
   '11111111-1111-1111-1111-111111111104'::uuid, 1, 'pending', null, null)
) as v(id, bill_id, approver_id, sequence, status, comment, acted_at)
where not exists (select 1 from public.approvals a where a.id = v.id);
