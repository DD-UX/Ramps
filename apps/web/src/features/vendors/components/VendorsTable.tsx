'use client';

import type { VendorListItemType } from '@ramps/schemas/vendors';
import { IconButton } from '@ramps/ui/IconButton';
import { MoreVertical } from '@ramps/ui/icons';
import { Money } from '@ramps/ui/Money';
import { Table, type TableColumn } from '@ramps/ui/Table';

import { formatPaymentMethod } from '../helpers/format-payment-method.helpers';
import { VendorsStatusPill } from './VendorsStatusPill';
import { Avatar } from '@ramps/ui/Avatar';

export interface VendorsTableProps {
  vendors: VendorListItemType[];
  total: number;
}

const COLUMNS: TableColumn<VendorListItemType>[] = [
  {
    id: 'name',
    header: 'Vendor',
    width: 'minmax(240px, 1fr)',
    sticky: 'left',
    // Name over a hushed category subtitle — the design's two-line vendor cell
    // ("Anderson Legal" / "Legal Services"). Category is null-safe.
    cell: (vendor) => (
      <>
        <div className="gap-rui-2 flex items-center">
          <Avatar name={vendor.name} size="sm" />
          <div className="gap-rui-1 flex flex-col">
            <span className="text-ink">{vendor.name}</span>
            {vendor.category && <span className="text-xs text-hushed">{vendor.category}</span>}
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'owner',
    header: 'Owner',
    width: '200px',
    cell: (vendor) =>
      vendor.owner_name ? (
        <span className="text-ink">{vendor.owner_name}</span>
      ) : (
        <span className="text-hushed italic">Unassigned</span>
      ),
  },
  {
    id: 'total_spend',
    header: 'Total spend',
    width: '160px',
    align: 'right',
    // Derived at read time (sum of the vendor's bills) — stands in for the
    // design's 365-day spend column, which we don't have windowed data for.
    cell: (vendor) => <Money cents={vendor.total_spend_cents} />,
  },
  {
    id: 'default_payment_method',
    header: 'Payment method',
    width: '180px',
    cell: (vendor) => formatPaymentMethod(vendor.default_payment_method),
  },
  {
    id: 'status',
    header: 'Status',
    width: '160px',
    cell: (vendor) => <VendorsStatusPill status={vendor.status} />,
  },
  {
    id: 'menu',
    header: '',
    width: '56px',
    align: 'center',
    sticky: 'right',
    // The trailing row-action menu from the design. Disabled placeholder — the
    // per-vendor actions aren't wired yet. No click shield needed: the browser
    // never dispatches click events from a disabled button, so a press here
    // can't bubble into the row's navigate-to-detail. When the menu is wired,
    // its own onClick must `stopPropagation` to keep that behavior.
    cell: () => <IconButton label="Vendor actions" icon={<MoreVertical size={16} />} disabled />,
  },
];

export function VendorsTable({ vendors, total }: VendorsTableProps) {
  return (
    <Table
      data={vendors}
      columns={COLUMNS}
      getRowId={(vendor) => vendor.id}
      footer={{
        type: 'pagination',
        page: 1,
        pageSize: vendors.length || 1,
        totalCount: total,
        noun: 'vendors',
      }}
      className="h-full"
    />
  );
}
