-- Part B: 10 more bills spread across every tab so the list has volume to paginate.
-- Additive + idempotent (guarded by id). Beyond-draft rows carry complete header data;
-- the two Drafts rows (d101 missing_info, d102 draft) stay intentionally sparse in the row
-- (their PDFs are made complete via the generator override map).

-- entity: Ramps Inc. 2222...201 · created_by: Ava Chen 1111...102
insert into public.bills
  (id, vendor_id, entity_id, created_by, source, invoice_number, invoice_date, due_date,
   accounting_date, po_number, amount_cents, currency, memo, status)
select v.* from (values
  -- Drafts tab
  ('b0000000-0000-0000-0000-00000000d101'::uuid, null::uuid, null::uuid,
   '11111111-1111-1111-1111-111111111102'::uuid, 'email'::bill_source, null::text, null::date, '2026-07-25'::date,
   null::date, null::text, 78000::bigint, 'USD', 'Forwarded invoice — vendor not matched yet', 'missing_info'::bill_status),
  ('b0000000-0000-0000-0000-00000000d102'::uuid, 'a0000000-0000-0000-0000-0000000000e1'::uuid, '22222222-2222-2222-2222-222222222201'::uuid,
   '11111111-1111-1111-1111-111111111102'::uuid, 'manual', 'WBM-4502', '2026-07-01', null,
   null, null, 43200, 'USD', 'July supplies — still drafting', 'draft'),
  -- For approval tab
  ('b0000000-0000-0000-0000-00000000d103'::uuid, 'a0000000-0000-0000-0000-0000000000e2'::uuid, '22222222-2222-2222-2222-222222222201'::uuid,
   '11111111-1111-1111-1111-111111111102'::uuid, 'email', 'FIG-99340', '2026-06-28', '2026-07-28',
   '2026-06-30', null, 180000, 'USD', 'Figma — additional seats', 'awaiting_approval'),
  ('b0000000-0000-0000-0000-00000000d104'::uuid, 'a0000000-0000-0000-0000-0000000000e3'::uuid, '22222222-2222-2222-2222-222222222201'::uuid,
   '11111111-1111-1111-1111-111111111102'::uuid, 'upload', 'AL-2026-95', '2026-06-22', '2026-07-22',
   '2026-06-30', 'PO-5540', 360000, 'USD', 'Q3 legal retainer', 'awaiting_approval'),
  -- For payment tab
  ('b0000000-0000-0000-0000-00000000d105'::uuid, 'a0000000-0000-0000-0000-0000000000e4'::uuid, '22222222-2222-2222-2222-222222222201'::uuid,
   '11111111-1111-1111-1111-111111111102'::uuid, 'upload', 'MM-3355', '2026-06-18', '2026-07-18',
   '2026-06-30', null, 540000, 'USD', 'July campaign — media buy', 'approved'),
  ('b0000000-0000-0000-0000-00000000d106'::uuid, 'a0000000-0000-0000-0000-0000000000e5'::uuid, '22222222-2222-2222-2222-222222222201'::uuid,
   '11111111-1111-1111-1111-111111111102'::uuid, 'manual', 'NW-1140', '2026-06-24', '2026-07-24',
   '2026-06-30', null, 94000, 'USD', 'Freight — Q2 true-up', 'approved'),
  ('b0000000-0000-0000-0000-00000000d107'::uuid, 'a0000000-0000-0000-0000-0000000000e2'::uuid, '22222222-2222-2222-2222-222222222201'::uuid,
   '11111111-1111-1111-1111-111111111102'::uuid, 'email', 'FIG-99361', '2026-06-15', '2026-07-15',
   '2026-06-30', null, 210000, 'USD', 'Figma — enterprise add-on', 'scheduled'),
  ('b0000000-0000-0000-0000-00000000d108'::uuid, 'a0000000-0000-0000-0000-0000000000e3'::uuid, '22222222-2222-2222-2222-222222222201'::uuid,
   '11111111-1111-1111-1111-111111111102'::uuid, 'manual', 'AL-2026-77', '2026-06-05', '2026-08-05',
   '2026-06-30', null, 600000, 'USD', 'Advisory — 2 installments', 'partially_paid'),
  -- History tab
  ('b0000000-0000-0000-0000-00000000d109'::uuid, 'a0000000-0000-0000-0000-0000000000e1'::uuid, '22222222-2222-2222-2222-222222222201'::uuid,
   '11111111-1111-1111-1111-111111111102'::uuid, 'manual', 'WBM-4460', '2026-05-18', '2026-06-18',
   '2026-05-31', null, 115000, 'USD', 'April/May supplies', 'paid'),
  ('b0000000-0000-0000-0000-00000000d110'::uuid, 'a0000000-0000-0000-0000-0000000000e4'::uuid, '22222222-2222-2222-2222-222222222201'::uuid,
   '11111111-1111-1111-1111-111111111102'::uuid, 'upload', 'MM-3301', '2026-05-10', '2026-06-10',
   '2026-05-31', null, 420000, 'USD', 'May campaign — paid', 'paid')
) as v(id, vendor_id, entity_id, created_by, source, invoice_number, invoice_date, due_date,
       accounting_date, po_number, amount_cents, currency, memo, status)
where not exists (select 1 from public.bills b where b.id = v.id);
