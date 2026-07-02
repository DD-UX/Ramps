# Supabase — local setup & run

Steps to bring the database online once the Supabase CLI is installed. The
repo currently ships only the directory skeleton (`supabase/migrations/`,
`supabase/seed.sql`); this doc is the runbook for filling it in and running it.

Related: [ANALYSIS §4 — architecture / data model](ANALYSIS.md#4-architecture),
AGENTS.md § `supabase/`.

## 1. Prerequisites

- **Docker** running (the local stack — Postgres, Studio, Auth — runs in containers).
- **Supabase CLI**. Do **not** add it as a project dependency; install it on the machine:
  ```bash
  brew install supabase/tap/supabase   # macOS
  # or: https://supabase.com/docs/guides/cli
  supabase --version
  ```
- Node `24.14.1` (see `.nvmrc`) + pnpm `10.29.2` for the app side.

## 2. Initialize (one-time, if not already present)

`supabase init` creates `supabase/config.toml`. We already keep `migrations/`
and `seed.sql` under version control, so only run this if `config.toml` is
missing, and keep the generated file minimal.

```bash
supabase init            # generates supabase/config.toml
```

Commit `config.toml`. Confirm `seed.sql` is wired in it:

```toml
[db.seed]
enabled = true
sql_paths = ["./seed.sql"]
```

## 3. Author migrations

Migrations are **append-only** SQL under `supabase/migrations/`. Create one:

```bash
supabase migration new create_core_tables
```

Fill it following the domain rules (AGENTS.md § `supabase/`):

- Money stored as `int` (integer cents) — never floats.
- Status enums + `CHECK` constraints defend the domain at the DB layer.
- **Bills and payments are separate tables** with independent status enums.
- FK integrity between vendors → bills → payments.
- Basic RLS as noted in ANALYSIS.

Keep these in **lockstep with `packages/schemas`** (zod) — the enums and
constraints must mirror the schemas, since schemas are the contract.

## 4. Seed data

`supabase/seed.sql` should tell a story and survive `db reset`:

- ~15 vendors, ~40 bills spanning **every** lifecycle state, one failed payment.
- Deterministic IDs so screenshots/tests are stable.

## 5. Run

```bash
supabase start           # boots local Postgres/Studio/Auth in Docker
supabase db reset        # applies all migrations, then runs seed.sql
```

`db reset` is the one-command demo: fresh DB → migrations → seed. Re-run it
any time to get back to a known-good state.

Studio: http://localhost:54323 · API/DB URL + anon key printed by `supabase start`.

Stop the stack:

```bash
supabase stop
```

## 6. Wire the app

- Local API URL + anon key go into `apps/web` env (`.env.local`, gitignored).
- **Server-only access.** The Supabase JS client is used from route handlers /
  server actions and wrapped by `@ramps/sdk`. No client-side Supabase access —
  the DB shape is not the public contract; the API is (AGENTS.md non-negotiables).

## 7. Generate DB types (optional cross-check)

Supabase can emit TypeScript types from the live schema. Use them only to
**verify** that `packages/schemas` (the source of truth) stays in lockstep with
the DB — not as an import target:

```bash
supabase gen types typescript --local > /tmp/db-types.ts   # inspect, don't commit as the contract
```

## Deploy note

For the hosted demo, link and push migrations to a hosted project
(`supabase link`, `supabase db push`) and seed it once. The deployed link is
the primary demo path; local `supabase start` is the fallback for reviewers
with Docker (ANALYSIS risk table).
