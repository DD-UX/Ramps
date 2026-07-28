-- 0010 — rename the terminal category: History → Paid.
--
-- The tab's one member has always been the `paid` status, so the name now says
-- what the list IS instead of gesturing at an audit trail. `code` moves with it
-- ('history' → 'paid'): the `?tab=` slug is user-visible URL surface, and the
-- chevron whitelist opts categories in BY CODE — this rename is what makes the
-- settled bills chevron-navigable. Old `?tab=history` links degrade safely: an
-- unknown code resolves to the default (Overview) tab.
--
-- Idempotent by predicate: a fresh database seeded after this migration already
-- carries the 'paid' row, so the update simply matches nothing.
update bill_tabs
set name = 'Paid', code = 'paid'
where code = 'history';
