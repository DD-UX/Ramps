-- Line items for the 10 new bills. d101 (missing_info) stays line-less like the
-- existing unmatched draft; every beyond-draft bill gets fully-coded lines that sum to total.
-- Guarded by id → idempotent.

insert into public.bill_line_items
  (id, bill_id, line_no, kind, description, qty, unit_price_cents, amount_cents,
   gl_account_id, department_id, class_id, location_id, tax_code_id, billable, coding_source)
select v.* from (values
  -- d102 draft · W.B. Mason $432 · Office Supplies
  ('c1000000-0000-0000-0000-00000000d102'::uuid, 'b0000000-0000-0000-0000-00000000d102'::uuid, 1, 'expense'::line_item_kind,
   'Office supplies — July'::text, null::int, null::bigint, 43200::bigint,
   '33333333-3333-3333-3333-333333333301'::uuid, '44444444-4444-4444-4444-444444444403'::uuid,
   '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666601'::uuid,
   '88888888-8888-8888-8888-888888888801'::uuid, false, 'vendor_default'::coding_source),
  -- d103 awaiting_approval · Figma $1,800 · Software
  ('c1000000-0000-0000-0000-00000000d103'::uuid, 'b0000000-0000-0000-0000-00000000d103'::uuid, 1, 'item',
   'Figma — additional seats', 20, 9000, 180000,
   '33333333-3333-3333-3333-333333333302'::uuid, '44444444-4444-4444-4444-444444444401'::uuid,
   '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666601'::uuid,
   '88888888-8888-8888-8888-888888888801'::uuid, false, 'vendor_default'),
  -- d104 awaiting_approval · Anderson Legal $3,600 · Prof Svc
  ('c1000000-0000-0000-0000-00000000d104'::uuid, 'b0000000-0000-0000-0000-00000000d104'::uuid, 1, 'expense',
   'Q3 legal retainer', null, null, 360000,
   '33333333-3333-3333-3333-333333333303'::uuid, '44444444-4444-4444-4444-444444444401'::uuid,
   '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666601'::uuid,
   '88888888-8888-8888-8888-888888888801'::uuid, false, 'user'),
  -- d105 approved · Meridian Media $5,400 · Marketing
  ('c1000000-0000-0000-0000-00000000d105'::uuid, 'b0000000-0000-0000-0000-00000000d105'::uuid, 1, 'item',
   'July campaign — media buy', 6, 90000, 540000,
   '33333333-3333-3333-3333-333333333304'::uuid, '44444444-4444-4444-4444-444444444402'::uuid,
   '55555555-5555-5555-5555-555555555501'::uuid, '66666666-6666-6666-6666-666666666602'::uuid,
   '88888888-8888-8888-8888-888888888801'::uuid, true, 'ramp'),
  -- d106 approved · Northwind Freight $940 · Prof Svc
  ('c1000000-0000-0000-0000-00000000d106'::uuid, 'b0000000-0000-0000-0000-00000000d106'::uuid, 1, 'expense',
   'Freight — Q2 true-up', null, null, 94000,
   '33333333-3333-3333-3333-333333333303'::uuid, '44444444-4444-4444-4444-444444444403'::uuid,
   '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666602'::uuid,
   '88888888-8888-8888-8888-888888888801'::uuid, false, 'user'),
  -- d107 scheduled · Figma $2,100 · Software
  ('c1000000-0000-0000-0000-00000000d107'::uuid, 'b0000000-0000-0000-0000-00000000d107'::uuid, 1, 'item',
   'Figma — enterprise add-on', 14, 15000, 210000,
   '33333333-3333-3333-3333-333333333302'::uuid, '44444444-4444-4444-4444-444444444401'::uuid,
   '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666601'::uuid,
   '88888888-8888-8888-8888-888888888801'::uuid, false, 'vendor_default'),
  -- d108 partially_paid · Anderson Legal $6,000 · Prof Svc (2 installments)
  ('c1000000-0000-0000-0000-00000000d181'::uuid, 'b0000000-0000-0000-0000-00000000d108'::uuid, 1, 'expense',
   'Advisory — installment 1', null, null, 300000,
   '33333333-3333-3333-3333-333333333303'::uuid, '44444444-4444-4444-4444-444444444401'::uuid,
   '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666601'::uuid,
   '88888888-8888-8888-8888-888888888801'::uuid, false, 'user'),
  ('c1000000-0000-0000-0000-00000000d182'::uuid, 'b0000000-0000-0000-0000-00000000d108'::uuid, 2, 'expense',
   'Advisory — installment 2', null, null, 300000,
   '33333333-3333-3333-3333-333333333303'::uuid, '44444444-4444-4444-4444-444444444403'::uuid,
   '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666601'::uuid,
   '88888888-8888-8888-8888-888888888801'::uuid, false, 'user'),
  -- d109 paid · W.B. Mason $1,150 · Office
  ('c1000000-0000-0000-0000-00000000d109'::uuid, 'b0000000-0000-0000-0000-00000000d109'::uuid, 1, 'expense',
   'April/May supplies', null, null, 115000,
   '33333333-3333-3333-3333-333333333301'::uuid, '44444444-4444-4444-4444-444444444403'::uuid,
   '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666601'::uuid,
   '88888888-8888-8888-8888-888888888801'::uuid, false, 'vendor_default'),
  -- d110 paid · Meridian Media $4,200 · Marketing
  ('c1000000-0000-0000-0000-00000000d110'::uuid, 'b0000000-0000-0000-0000-00000000d110'::uuid, 1, 'item',
   'May campaign', 7, 60000, 420000,
   '33333333-3333-3333-3333-333333333304'::uuid, '44444444-4444-4444-4444-444444444402'::uuid,
   '55555555-5555-5555-5555-555555555501'::uuid, '66666666-6666-6666-6666-666666666602'::uuid,
   '88888888-8888-8888-8888-888888888801'::uuid, true, 'ramp')
) as v(id, bill_id, line_no, kind, description, qty, unit_price_cents, amount_cents,
       gl_account_id, department_id, class_id, location_id, tax_code_id, billable, coding_source)
where not exists (select 1 from public.bill_line_items li where li.id = v.id);
