-- ramps — bill_tabs lookup (0002)
--
-- The Bill Pay tab bar as DATA, not a hardcoded constant. Ramp's IA groups the
-- nine-state bill lifecycle into five product categories (Overview | Drafts |
-- For approval | For payment | History); this table is the single source of
-- truth for that grouping, so the tabs — and, later, custom saved views — can
-- change without a code change.
--
-- Lookup convention (repo rule): every lookup/catalog table carries id + name +
-- code, then its own characteristics. Here `code` is the URL-safe slug the app
-- passes as `?tab=` (unique, readable, reseed-stable), `name` is the label, and
-- `statuses` is the group it rolls up — a `bill_status[]` so the enum guards the
-- values at the DB level. An empty array means "unfiltered" (the Overview tab).
--
-- Mirrors @ramps/schemas BillTabSchema. Append-only: never rewrite 0001.

begin;

create table bill_tabs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) >= 1),
  -- The `?tab=` slug: unique, URL-safe, stable across reseeds.
  code text not null unique check (length(code) >= 1),
  -- The lifecycle states this tab rolls up. Empty {} = unfiltered (Overview).
  statuses bill_status[] not null default '{}',
  -- Left-to-right order in the tab bar.
  sort_order integer not null check (sort_order >= 0)
);

create index bill_tabs_sort_idx on bill_tabs (sort_order);

commit;
