import {
  ApprovalStagesResponseSchema,
  type ApprovalStagesResponseType,
  type SaveApprovalStagesType,
} from '@ramps/schemas/approvals';
import {
  BillListResponseSchema,
  type BillListResponseType,
  BillMutationResponseSchema,
  type BillMutationResponseType,
  type BillSaveType,
} from '@ramps/schemas/bills';
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
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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

  /**
   * Resource methods. Each one names its result schema so the response is
   * validated the moment it lands — the browser never sees unparsed JSON.
   */
  const bills = {
    /**
     * GET /bills — the Bill Pay table, optionally scoped to a lifecycle tab
     * (`overview` | `drafts` | `for_approval` | `for_payment` | `history`). The
     * server maps the tab to its status group; omitting it is the Overview view.
     */
    list(params: { tab?: string } = {}, signal?: AbortSignal): Promise<BillListResponseType> {
      const query = params.tab ? `?tab=${encodeURIComponent(params.tab)}` : '';
      return request(`/bills${query}`, { schema: BillListResponseSchema, signal });
    },

    /**
     * PUT /bills/:id/approval-stages — replace a bill's editable approval route
     * with `input`'s stages. Returns the persisted chain (server ids echoed) so
     * the caller can reconcile freshly-added stages against optimistic ones.
     */
    saveApprovalStages(
      billId: string,
      input: SaveApprovalStagesType,
      signal?: AbortSignal,
    ): Promise<ApprovalStagesResponseType> {
      return request(`/bills/${encodeURIComponent(billId)}/approval-stages`, {
        method: 'PUT',
        schema: ApprovalStagesResponseSchema,
        body: input,
        signal,
      });
    },

    /**
     * PUT /bills/:id — SAVE DRAFT. Persist the whole edit form (header fields +
     * the line-items grid) for a pre-submit bill. Returns the re-read bill so
     * the caller can reset the form to the server's own truth (fresh line ids).
     */
    save(
      billId: string,
      input: BillSaveType,
      signal?: AbortSignal,
    ): Promise<BillMutationResponseType> {
      return request(`/bills/${encodeURIComponent(billId)}`, {
        method: 'PUT',
        schema: BillMutationResponseSchema,
        body: input,
        signal,
      });
    },

    /**
     * POST /bills/:id/submit — CREATE BILL. A superset of {@link save}: it saves
     * the same form, then moves the bill `draft`/`missing_info` →
     * `awaiting_approval`. Returns the re-read bill now in the approval queue.
     */
    submit(
      billId: string,
      input: BillSaveType,
      signal?: AbortSignal,
    ): Promise<BillMutationResponseType> {
      return request(`/bills/${encodeURIComponent(billId)}/submit`, {
        method: 'POST',
        schema: BillMutationResponseSchema,
        body: input,
        signal,
      });
    },
  };

  return { request, bills };
}

export type RampsClient = ReturnType<typeof createRampsClient>;
