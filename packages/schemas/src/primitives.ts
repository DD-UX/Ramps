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
