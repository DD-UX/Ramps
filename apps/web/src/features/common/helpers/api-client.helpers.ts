import { createRampsClient, type RampsClient } from '@ramps/sdk/client';

/**
 * The browser's one typed API client.
 *
 * `@ramps/sdk`'s client is the single place the front-end calls `fetch`, and it
 * `.parse()`s every response against a `@ramps/schemas` schema — so components
 * receive validated models, never raw JSON. The base URL is the app's own
 * `/api` route group, resolved relative to the current origin, so the same
 * client works in every environment without a `NEXT_PUBLIC_*` var.
 *
 * A module-level singleton: the client is stateless (it only closes over
 * `baseUrl` + `fetch`), so one instance is shared across the whole client
 * bundle rather than re-created per component.
 */
export const apiClient: RampsClient = createRampsClient({ baseUrl: '/api' });
