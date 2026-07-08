-- Part A: give every beyond-draft bill fully-coded line items so it passes
-- billSubmitReady() (each line: gl_account_id set, amount_cents > 0; lines sum to total).
-- Additive + idempotent: skips bills that already have line items. No deletes.

-- d010 · W.B. Mason $1,289.00 · Office Supplies (6010) — awaiting_approval
insert into public.bill_line_items
  (id, bill_id, line_no, kind, description, qty, unit_price_cents, amount_cents,
   gl_account_id, department_id, class_id, location_id, tax_code_id, billable, coding_source)
select 'c1000000-0000-0000-0000-00000000d010'::uuid, 'b0000000-0000-0000-0000-00000000d010'::uuid,
       1, 'expense', 'Office supplies — June re-order', null, null, 128900,
       '33333333-3333-3333-3333-333333333301'::uuid, '44444444-4444-4444-4444-444444444403'::uuid,
       '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666601'::uuid,
       '88888888-8888-8888-8888-888888888801'::uuid, false, 'vendor_default'
where not exists (select 1 from public.bill_line_items where bill_id = 'b0000000-0000-0000-0000-00000000d010'::uuid);

-- d004 · Figma $900.00 · Software Subscriptions (6020) — approved
insert into public.bill_line_items
  (id, bill_id, line_no, kind, description, qty, unit_price_cents, amount_cents,
   gl_account_id, department_id, class_id, location_id, tax_code_id, billable, coding_source)
select 'c1000000-0000-0000-0000-00000000d004'::uuid, 'b0000000-0000-0000-0000-00000000d004'::uuid,
       1, 'item', 'Figma — annual seats', 30, 3000, 90000,
       '33333333-3333-3333-3333-333333333302'::uuid, '44444444-4444-4444-4444-444444444401'::uuid,
       '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666601'::uuid,
       '88888888-8888-8888-8888-888888888801'::uuid, false, 'vendor_default'
where not exists (select 1 from public.bill_line_items where bill_id = 'b0000000-0000-0000-0000-00000000d004'::uuid);

-- d006 · Anderson Legal $8,000.00 · Professional Services (6030) — partially_paid (2 installments)
insert into public.bill_line_items
  (id, bill_id, line_no, kind, description, qty, unit_price_cents, amount_cents,
   gl_account_id, department_id, class_id, location_id, tax_code_id, billable, coding_source)
select 'c1000000-0000-0000-0000-00000000d061'::uuid, 'b0000000-0000-0000-0000-00000000d006'::uuid,
       1, 'expense', 'Litigation support — installment 1', null, null, 400000,
       '33333333-3333-3333-3333-333333333303'::uuid, '44444444-4444-4444-4444-444444444401'::uuid,
       '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666601'::uuid,
       '88888888-8888-8888-8888-888888888801'::uuid, false, 'user'
where not exists (select 1 from public.bill_line_items where bill_id = 'b0000000-0000-0000-0000-00000000d006'::uuid);

insert into public.bill_line_items
  (id, bill_id, line_no, kind, description, qty, unit_price_cents, amount_cents,
   gl_account_id, department_id, class_id, location_id, tax_code_id, billable, coding_source)
select 'c1000000-0000-0000-0000-00000000d062'::uuid, 'b0000000-0000-0000-0000-00000000d006'::uuid,
       2, 'expense', 'Litigation support — installment 2', null, null, 400000,
       '33333333-3333-3333-3333-333333333303'::uuid, '44444444-4444-4444-4444-444444444403'::uuid,
       '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666601'::uuid,
       '88888888-8888-8888-8888-888888888801'::uuid, false, 'user'
where not exists (select 1 from public.bill_line_items where id = 'c1000000-0000-0000-0000-00000000d062'::uuid);

-- d007 · W.B. Mason $612.00 · Office Supplies (6010) — paid
insert into public.bill_line_items
  (id, bill_id, line_no, kind, description, qty, unit_price_cents, amount_cents,
   gl_account_id, department_id, class_id, location_id, tax_code_id, billable, coding_source)
select 'c1000000-0000-0000-0000-00000000d007'::uuid, 'b0000000-0000-0000-0000-00000000d007'::uuid,
       1, 'expense', 'Office supplies — May', null, null, 61200,
       '33333333-3333-3333-3333-333333333301'::uuid, '44444444-4444-4444-4444-444444444403'::uuid,
       '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666601'::uuid,
       '88888888-8888-8888-8888-888888888801'::uuid, false, 'vendor_default'
where not exists (select 1 from public.bill_line_items where bill_id = 'b0000000-0000-0000-0000-00000000d007'::uuid);

-- d008 · Meridian Media $2,750.00 · Marketing (6040) — rejected
insert into public.bill_line_items
  (id, bill_id, line_no, kind, description, qty, unit_price_cents, amount_cents,
   gl_account_id, department_id, class_id, location_id, tax_code_id, billable, coding_source)
select 'c1000000-0000-0000-0000-00000000d008'::uuid, 'b0000000-0000-0000-0000-00000000d008'::uuid,
       1, 'item', 'Sponsored placements — May', 5, 55000, 275000,
       '33333333-3333-3333-3333-333333333304'::uuid, '44444444-4444-4444-4444-444444444402'::uuid,
       '55555555-5555-5555-5555-555555555501'::uuid, '66666666-6666-6666-6666-666666666602'::uuid,
       '88888888-8888-8888-8888-888888888801'::uuid, true, 'ramp'
where not exists (select 1 from public.bill_line_items where bill_id = 'b0000000-0000-0000-0000-00000000d008'::uuid);

-- d009 · Northwind Freight $520.00 · Professional Services (6030) — archived
insert into public.bill_line_items
  (id, bill_id, line_no, kind, description, qty, unit_price_cents, amount_cents,
   gl_account_id, department_id, class_id, location_id, tax_code_id, billable, coding_source)
select 'c1000000-0000-0000-0000-00000000d009'::uuid, 'b0000000-0000-0000-0000-00000000d009'::uuid,
       1, 'expense', 'Freight — inbound shipment', null, null, 52000,
       '33333333-3333-3333-3333-333333333303'::uuid, '44444444-4444-4444-4444-444444444403'::uuid,
       '55555555-5555-5555-5555-555555555502'::uuid, '66666666-6666-6666-6666-666666666602'::uuid,
       '88888888-8888-8888-8888-888888888801'::uuid, false, 'user'
where not exists (select 1 from public.bill_line_items where bill_id = 'b0000000-0000-0000-0000-00000000d009'::uuid);
