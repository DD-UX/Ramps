-- ramps — bill_tabs.created_by (0003)
--
-- Ownership for the tab catalog, ahead of the custom-views feature. A tab's
-- `created_by` is the user who made it; NULL means a system tab (the five
-- seeded categories no one owns). This single nullable column is the whole
-- system-vs-custom distinction — no separate `type` enum — so later a delete
-- can be gated to "the creator, or an admin": a NULL-owner (system) row is
-- undeletable, and a custom row is deletable only by its `created_by` (or an
-- admin). That permission logic isn't built yet; this migration is structure
-- only, and the seeded rows stay system (created_by = NULL) by default.
--
-- FK matches the repo convention (references users (id)); ON DELETE SET NULL so
-- a deleted user doesn't cascade away their tabs — the row just falls back to
-- system-owned. Append-only: never rewrite 0002.

begin;

alter table bill_tabs
  add column created_by uuid references users (id) on delete set null;

create index bill_tabs_created_by_idx on bill_tabs (created_by);

commit;
