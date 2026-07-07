import type { PaymentMethodType } from '@ramps/schemas/payments';

/**
 * Render a vendor's default payment rail as the product's short label. Vendors
 * carry a `default_payment_method` (the rail a new bill for them defaults to);
 * a null method (no default on file) renders as an em dash so the column never
 * shows a blank cell — the same "—" convention the bills table uses for null
 * dates.
 */
const PAYMENT_METHOD_LABEL: Record<PaymentMethodType, string> = {
  ach: 'ACH',
  check: 'Check',
  wire: 'Wire',
  card: 'Card',
};

export function formatPaymentMethod(method: PaymentMethodType | null): string {
  if (!method) return '—';
  return PAYMENT_METHOD_LABEL[method];
}
