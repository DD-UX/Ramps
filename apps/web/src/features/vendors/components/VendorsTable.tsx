'use client';

import type { VendorListItemType } from '@ramps/schemas/vendors';
import { Table, type TableColumn } from '@ramps/ui/Table';
import { useRouter } from 'next/navigation';

import { formatPaymentMethod } from '../helpers/format-payment-method.helpers';
import { VendorsStatusPill } from './VendorsStatusPill';

export interface VendorsTableProps {
  vendors: VendorListItemType[];
  total: number;
}

const COLUMNS: TableColumn<VendorListItemType>[] = [
  {
    id: 'name',
    header: 'Vendor',
    width: 'minmax(220px, 1fr)',
    sticky: 'left',
    cell: (vendor) => <span className="text-ink">{vendor.name}</span>,
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
    id: 'default_payment_method',
    header: 'Payment method',
    width: '180px',
    cell: (vendor) => formatPaymentMethod(vendor.default_payment_method),
  },
  {
    id: 'status',
    header: 'Status',
    width: '160px',
    sticky: 'right',
    cell: (vendor) => <VendorsStatusPill status={vendor.status} />,
  },
];

export function VendorsTable({ vendors, total }: VendorsTableProps) {
  const router = useRouter();

  return (
    <Table
      data={vendors}
      columns={COLUMNS}
      getRowId={(vendor) => vendor.id}
      selectable
      onRowClick={(vendor) => router.push(`/vendors/${vendor.id}`)}
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
