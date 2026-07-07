import { describe, expect, it } from 'vitest';

import { formatPaymentMethod } from './format-payment-method.helpers';

describe('formatPaymentMethod', () => {
  it('maps each rail to its product label', () => {
    expect(formatPaymentMethod('ach')).toBe('ACH');
    expect(formatPaymentMethod('check')).toBe('Check');
    expect(formatPaymentMethod('wire')).toBe('Wire');
    expect(formatPaymentMethod('card')).toBe('Card');
  });

  it('renders an em dash when no default method is on file', () => {
    expect(formatPaymentMethod(null)).toBe('—');
  });
});
