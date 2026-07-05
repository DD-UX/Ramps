import { createAdminClient } from '@supabase/server/core';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * @ramps/sdk/server — the SERVER half of the SDK.
 *
 * `client.ts` is the browser→API hop (fetch + zod). This is the API→DB hop:
 * the only place the app opens a Supabase connection. It lives behind the
 * route handlers, never in a component, and never in the browser bundle.
 *
 * Shape borrowed from the KarmaPlus SDK (a stateless per-request factory +
 * thin resource facades), re-grained for this repo: built on `@supabase/server`
 * with the new `sb_secret_` key (not `@supabase/supabase-js` + the legacy anon
 * key), and the facades parse into the `@ramps/schemas` zod models rather than
 * mapping into hand-written domain types — the schema already IS the type.
 */

/**
 * Open a fresh admin Supabase client for one server request.
 *
 * `createAdminClient()` resolves `SUPABASE_URL` + the secret key from the
 * environment (`SUPABASE_SECRET_KEY`, stored internally as the `default` key)
 * and authenticates with it — full DB access, RLS bypassed. That's the right
 * grain for this demo: access is gated at the route handler, not by per-user
 * RLS, so the handler talks to the DB as a trusted server.
 *
 * Stateless by contract: no session, no token refresh. Call it once per
 * request and let it go — never cache the client across requests.
 */
export function createServerSupabase(): SupabaseClient {
  return createAdminClient();
}

export type ServerSupabase = SupabaseClient;

/**
 * Normalize anything a facade throws into a plain `Error` with a useful
 * message. PostgREST hands back `{ message, code, details, hint }` objects
 * that are NOT `Error` instances; without this a failed query surfaces as
 * `[object Object]`. The KarmaPlus SDK maps into a rich `AppError` hierarchy —
 * we keep the same instinct (own the error boundary) but stay lean until a
 * caller actually needs to branch on error kinds.
 */
export function toSdkError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const { message, code } = error as { message?: unknown; code?: unknown };
    const prefix = typeof code === 'string' && code ? `[${code}] ` : '';
    return new Error(`${prefix}${String(message ?? 'Unknown SDK error')}`);
  }
  return new Error(typeof error === 'string' ? error : 'Unknown SDK error');
}
