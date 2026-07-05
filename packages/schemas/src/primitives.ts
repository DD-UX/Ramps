import { z } from 'zod';

/**
 * Shared primitive schemas. Domain entities (bills, vendors, payments…) build
 * on these and land in their own files as the model firms up.
 */

/** Money is always integer minor units (cents) — never floats. */
export const MoneyCentsSchema = z.number().int();
export type MoneyCentsType = z.infer<typeof MoneyCentsSchema>;

/** ISO-4217 currency code, upper-case (e.g. `USD`). */
export const CurrencyCodeSchema = z.string().length(3).toUpperCase();
export type CurrencyCodeType = z.infer<typeof CurrencyCodeSchema>;

/**
 * A UUID identifier — the 8-4-4-4-12 hex shape.
 *
 * We validate the SHAPE, not the RFC-4122 version/variant nibbles that
 * `z.uuid()` enforces. Postgres `gen_random_uuid()` emits real v4 (which passes
 * either way), but the demo seed uses readable, greppable ids like
 * `b0000000-0000-0000-0000-00000000d001` ("demo bill 1") whose version nibble
 * is `0` — valid UUID text, rejected by strict v4 validation. A shape regex
 * still rejects garbage and injection while letting the storytelling seed
 * survive the boundary parse.
 */
export const IdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
    message: 'Invalid UUID',
  });
export type IdType = z.infer<typeof IdSchema>;

/** Date-only ISO string (`2025-12-01`) — invoice/due/scheduled dates. */
export const IsoDateSchema = z.iso.date();
export type IsoDateType = z.infer<typeof IsoDateSchema>;

/** Full ISO timestamp (`2025-12-01T14:30:00Z`) — audit/acted/created times. */
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });
export type IsoDateTimeType = z.infer<typeof IsoDateTimeSchema>;
