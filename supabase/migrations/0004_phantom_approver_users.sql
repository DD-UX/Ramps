-- ramps — phantom approver users
--
-- The Approvals block (snapshot 10) lets you "Add approver by role": a step can
-- name a ROLE (e.g. "Any Admin") that resolves to one OR MORE real people, and
-- the chip renders that group. For that to look real, every role must be a
-- believable GROUP, not a single person. The base seed left admin=2, AP=2,
-- employee=1; this tops each role up to three so a role resolves to a small
-- stack of avatars.
--
-- Ids continue the seed's pinned `11111111-…-1111xx` sequence so the demo graph
-- stays deterministic. `on conflict (id) do nothing` keeps this idempotent and
-- safe to run after seed.sql (which now also carries these rows) or twice.

begin;

insert into users (id, name, email, role, avatar_url) values
  -- admin group → Diego, Priya, + Nadia
  ('11111111-1111-1111-1111-111111111106', 'Nadia Okafor',    'nadia@ramps.demo',   'admin',            null),
  -- accounts_payable group → Ava, Marcus, + Sofia
  ('11111111-1111-1111-1111-111111111107', 'Sofia Marin',     'sofia@ramps.demo',   'accounts_payable', null),
  -- employee group → Tom, + Leo, Hannah
  ('11111111-1111-1111-1111-111111111108', 'Leo Park',        'leo@ramps.demo',     'employee',         null),
  ('11111111-1111-1111-1111-111111111109', 'Hannah Smolinski','hannah@ramps.demo',  'employee',         null)
on conflict (id) do nothing;

commit;
