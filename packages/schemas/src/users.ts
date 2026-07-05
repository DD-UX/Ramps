import { z } from 'zod';

import { RoleSchema } from './policies.js';
import { IdSchema } from './primitives.js';

/**
 * Users — seeded identities, no signup (ANALYSIS §9.1). The role switcher
 * changes who we're "acting as"; authorization stays real via
 * `effectivePolicies()` in ./policies.
 */
export const UserSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  email: z.email(),
  role: RoleSchema,
  /** Initials-avatar seed / optional image. Null → render initials. */
  avatar_url: z.url().nullable(),
});
export type UserType = z.infer<typeof UserSchema>;
