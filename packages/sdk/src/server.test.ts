import { describe, expect, it } from 'vitest';

import { toSdkError } from './server.js';

/**
 * toSdkError is the facade error boundary: PostgREST hands back plain
 * `{ message, code, ... }` objects that aren't `Error`s, and without
 * normalization a failed query surfaces as `[object Object]`. These lock the
 * three shapes it must handle.
 */
describe('toSdkError', () => {
  it('returns Error instances unchanged', () => {
    const original = new Error('boom');
    expect(toSdkError(original)).toBe(original);
  });

  it('wraps a PostgREST-style object, prefixing the code', () => {
    const result = toSdkError({ message: 'row not found', code: 'PGRST116' });
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('[PGRST116] row not found');
  });

  it('wraps a message-only object without a prefix', () => {
    expect(toSdkError({ message: 'plain failure' }).message).toBe('plain failure');
  });

  it('wraps a bare string', () => {
    expect(toSdkError('string failure').message).toBe('string failure');
  });

  it('falls back for an unrecognized value', () => {
    expect(toSdkError(null).message).toBe('Unknown SDK error');
    expect(toSdkError(42).message).toBe('Unknown SDK error');
  });
});
