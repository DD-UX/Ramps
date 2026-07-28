'use client';

import { Banner } from '@ramps/ui/Banner';
import { useWatch } from 'react-hook-form';

import { BILL_DETAIL_DATA_LEVEL, dataLevelAtLeast } from '../constants/data-level.constants';
import { useBillDetail } from '../context/BillDetail.context';
import { vendorCompleteness } from '../helpers/section-completeness.helpers';
import { useRefOptions } from '../hooks/useRefOptions';
import { BillDetailsFieldSkeleton } from './BillDetailsFieldSkeleton';
import { BillDetailsSection } from './BillDetailsSection';
import { BillDetailsSelectField } from './BillDetailsSelectField';

/**
 * Vendor section (snapshots 5–6): match the invoice to a vendor, or create a
 * new one. When no vendor is matched the section reads `Incomplete` and shows
 * the blocking amber banner ("Add missing information") the draft screen leans
 * on. Buttons are stubbed — persistence is out of scope for this pass.
 *
 * A HEADER concern (`vendor_id` rides the rail item), so it needs `seed`:
 * below it the real section title frames two field bars — no banner, no
 * completeness pill, since an unjudged placeholder must not read "Incomplete".
 * The gate/Loaded split keeps the form hooks unconditional.
 */
export function BillDetailsVendor() {
  const { dataLevel } = useBillDetail();
  if (!dataLevelAtLeast(dataLevel, BILL_DETAIL_DATA_LEVEL.SEED)) {
    return (
      <BillDetailsSection title="Vendor">
        <div className="gap-rui-2 grid">
          <BillDetailsFieldSkeleton />
          <BillDetailsFieldSkeleton />
        </div>
      </BillDetailsSection>
    );
  }
  return <BillDetailsVendorLoaded />;
}

function BillDetailsVendorLoaded() {
  const { control } = useBillDetail().form;
  const { vendors, entities } = useRefOptions();

  const vendorId = useWatch({ control, name: 'vendor_id' });
  const completeness = vendorCompleteness({ vendor_id: vendorId });
  const unmatched = completeness === 'incomplete';

  return (
    <BillDetailsSection title="Vendor" completeness={completeness}>
      {unmatched && (
        <Banner
          tone="critical"
          title="Add missing information"
          description="This invoice isn't matched to a vendor yet. Select one or create a new vendor to continue."
        />
      )}
      <div className="gap-rui-2 grid">
        <BillDetailsSelectField
          name="vendor_id"
          label="Vendor"
          options={vendors}
          placeholder="Select a vendor"
        />
        <BillDetailsSelectField
          name="entity_id"
          label="Entity"
          options={entities}
          placeholder="Select an entity"
        />
        {/* We are missing adding the State and Contact email fields */}
        {/* State (required) */}
        {/* Due to regulatory requirements, Ramp needs to know where this vendor is located in order to pay this bill */}
        {/* [                      ] */}
        {/* Contact email (required) */}
        {/* [                      ] */}
      </div>
    </BillDetailsSection>
  );
}
