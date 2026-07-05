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

/** A UUID identifier as produced by Postgres `gen_random_uuid()`. */
export const IdSchema = z.string().uuid();
export type IdType = z.infer<typeof IdSchema>;

/** Date-only ISO string (`2025-12-01`) — invoice/due/scheduled dates. */
export const IsoDateSchema = z.iso.date();
export type IsoDateType = z.infer<typeof IsoDateSchema>;

/** Full ISO timestamp (`2025-12-01T14:30:00Z`) — audit/acted/created times. */
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });
export type IsoDateTimeType = z.infer<typeof IsoDateTimeSchema>;
