import type { ZodType } from 'zod';

/**
 * @ramps/sdk — the typed client.
 *
 * The ONLY place the app calls `fetch`. Every response is `.parse()`d with a
 * schema from `@ramps/schemas` before it is returned, so callers receive
 * validated models and the front/back contract cannot silently drift.
 *
 * Resource methods (bills, vendors, payments…) are added on top of `request`
 * as the API surface lands; each one passes its result schema here.
 */

export interface RampsClientOptions {
  /** Base URL for the API (e.g. `/api` in the Next app, absolute in tests). */
  baseUrl: string;
  /** Injected for testing; defaults to global fetch. */
  fetch?: typeof globalThis.fetch;
}

export interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Schema the response body is validated against before returning. */
  schema: ZodType<T>;
  body?: unknown;
  signal?: AbortSignal;
}

export function createRampsClient(options: RampsClientOptions) {
  const doFetch = options.fetch ?? globalThis.fetch;
  const base = options.baseUrl.replace(/\/$/, '');

  async function request<T>(path: string, opts: RequestOptions<T>): Promise<T> {
    const response = await doFetch(`${base}${path}`, {
      method: opts.method ?? 'GET',
      headers: opts.body ? { 'content-type': 'application/json' } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    const json: unknown = await response.json();
    // Parse at the boundary — the SDK returns validated models, never raw JSON.
    return opts.schema.parse(json);
  }

  return { request };
}

export type RampsClient = ReturnType<typeof createRampsClient>;
