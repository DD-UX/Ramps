import type { VendorStatusType } from '@ramps/schemas/vendors';

/**
 * VendorsStatusPill — a vendor's active/inactive state as a token-tinted badge.
 *
 * The shared `@ramps/ui` StatusPill is deliberately scoped to the nine
 * `bills.status` lifecycle states (its union is the visual projection of that
 * enum). Vendors have their own two-state enum, so rather than widen the shared
 * primitive we render the same restrained tone treatment here, feature-local:
 * `active` → positive, `inactive` → neutral. Tones come from tokens, never raw
 * hex — matching the shared pill exactly.
 */
const STATUS_META: Record<VendorStatusType, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-tone-positive-surface text-tone-positive-on' },
  inactive: { label: 'Inactive', className: 'bg-tone-neutral-surface text-tone-neutral-on' },
};

export interface VendorsStatusPillProps {
  status: VendorStatusType;
}

export function VendorsStatusPill({ status }: VendorsStatusPillProps) {
  const { label, className } = STATUS_META[status];
  return (
    <span
      className={`gap-rui-1 rounded-pill px-rui-3 py-rui-1 text-xs font-heading inline-flex items-center whitespace-nowrap ${className}`}
    >
      <span aria-hidden className="size-1.5 rounded-pill bg-current opacity-70" />
      {label}
    </span>
  );
}
