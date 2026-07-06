# AGENTS.md — `@ramps/sdk` (the typed data layer)

Scoped rules for working **inside `packages/sdk`**. Augments the root
[AGENTS.md](../../AGENTS.md); the `packages/sdk` section there (the only place
`fetch` is called, every response `.parse()`d, no React) still applies.

## The boundary: parse, never cast

Every facade returns validated models from `@ramps/schemas`, never raw
PostgREST/HTTP JSON. The schema is the single Zod gate — a DB shape the schema
rejects must fail loudly at `.parse()`, not leak into the app as `any`.

```ts
// ✅ DO — the schema is the boundary guard
return BillListItemSchema.parse(row);
// ❌ DON'T — a cast is a lie, not a runtime proof
return row as BillListItemType;
```

## Lookup / catalog tables: id + name + code, then their own fields

**Every lookup (reference/catalog) table carries `id`, `name`, and `code`,
followed by its own characteristics.** This is a repo-wide invariant, not an
SDK quirk — the accounting dimensions (`gl_accounts`, `departments`, `classes`,
`locations`, `tax_codes`, `custom_dimensions`) and `bill_tabs` all share it.

- `id` — uuid primary key (`gen_random_uuid()`).
- `name` — the human display label.
- `code` — a unique, URL-safe slug: the stable public handle you pass in a URL
  (`?tab=for_payment`) or persist as a reference. It survives a reseed (unlike a
  fresh uuid) and reads better than an opaque id, while the row keeps its `id`
  for foreign keys.
- **then** the table's own columns (e.g. `bill_tabs.statuses`, `tax_codes.rate_bps`).

Pass the **`code`** across boundaries (URLs, query params, config), not the raw
uuid: readable, unique, reseed-stable. The table still owns `code → row`, so a
grouping/label change is a data change, not a code change.

```ts
// A lookup schema — id, name, code, then its own fields.
export const BillTabSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  code: z.string().min(1), // the ?tab= slug — unique, URL-safe
  statuses: z.array(BillStatusSchema), // its own characteristic
  sort_order: z.number().int().nonnegative(),
});
```

New lookup? Mirror this shape in the migration (with a `unique` on `code`), the
Zod schema, and the seed — in lockstep.

## Facades stay request-safe and framework-free

Server facades take the caller's Supabase client as their first argument (no
module-level singleton), and stay plain async functions — **no React here**, not
even `cache()` (the SDK has no `react` dependency, and the root rule keeps this
package framework-agnostic). Request-level dedup is the caller's job: the web
app wraps a facade in React `cache()` at the feature/page layer (where `react`
already lives) when the same data is read more than once per request — e.g. a
tab catalog needed by both the filtered query and the tab bar.
