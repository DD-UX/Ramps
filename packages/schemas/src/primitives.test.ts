import { describe, expect, it } from 'vitest';

import { IdSchema, MoneyCentsSchema } from './primitives';

/**
 * IdSchema guards every id that crosses the boundary. It must accept the two
 * UUID flavors the DB actually produces — real v4 from `gen_random_uuid()` AND
 * the readable, greppable demo-seed ids (`…d001`) whose version nibble is `0`
 * (valid UUID text, but rejected by strict RFC-4122 v4 validation, which is the
 * bug that surfaced as a ZodError on the /bills first paint) — while still
 * rejecting anything that isn't UUID-shaped, so a hand-typed id can't inject.
 */
describe('IdSchema', () => {
  it('accepts a real gen_random_uuid() v4', () => {
    expect(() => IdSchema.parse('3f1e8c2a-9b4d-4e7f-8a1c-2d6b0e5f7a90')).not.toThrow();
  });

  it('accepts the readable demo-seed id (version nibble 0)', () => {
    // The seed uses these so the tables read like a story: "demo bill 1".
    expect(() => IdSchema.parse('b0000000-0000-0000-0000-00000000d001')).not.toThrow();
    expect(() => IdSchema.parse('a0000000-0000-0000-0000-00000000v001')).toThrow(); // 'v' isn't hex
  });

  it('rejects a non-UUID-shaped string', () => {
    expect(() => IdSchema.parse('not-a-uuid')).toThrow();
    expect(() => IdSchema.parse('')).toThrow();
    expect(() => IdSchema.parse('12345')).toThrow();
  });

  it('rejects the right shape with wrong segment lengths', () => {
    expect(() => IdSchema.parse('b000-0000-0000-0000-00000000d001')).toThrow();
    expect(() => IdSchema.parse('b0000000-0000-0000-0000-00000000d0011')).toThrow();
  });
});

/**
 * MoneyCentsSchema is integer minor units — it must allow negatives (credits,
 * refunds, reversals) but reject floats (the float-money footgun the domain
 * bans everywhere).
 */
describe('MoneyCentsSchema', () => {
  it('accepts positive, zero, and negative integers', () => {
    expect(MoneyCentsSchema.parse(12500)).toBe(12500);
    expect(MoneyCentsSchema.parse(0)).toBe(0);
    expect(MoneyCentsSchema.parse(-4200)).toBe(-4200);
  });

  it('rejects a floating-point amount', () => {
    expect(() => MoneyCentsSchema.parse(125.5)).toThrow();
  });
});
