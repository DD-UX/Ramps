'use client';

import { Banner } from '@ramps/ui/Banner';
import { Button } from '@ramps/ui/Button';
import { useWatch } from 'react-hook-form';

import { useBillDetail } from '../context/BillDetail.context';
import { vendorCompleteness } from '../helpers/section-completeness.helpers';
import { useRefOptions } from '../hooks/useRefOptions';
import { BillDetailsSection } from './BillDetailsSection';
import { BillDetailsSelectField } from './BillDetailsSelectField';

/**
 * Vendor section (snapshots 5–6): match the invoice to a vendor, or create a
 * new one. When no vendor is matched the section reads `Incomplete` and shows
 * the blocking amber banner ("Add missing information") the draft screen leans
 * on. Buttons are stubbed — persistence is out of scope for this pass.
 */
export function BillDetailsVendor() {
  const { control } = useBillDetail().form;
  const { vendors, entities } = useRefOptions();

  const vendorId = useWatch({ control, name: 'vendor_id' });
  const completeness = vendorCompleteness({ vendor_id: vendorId });
  const unmatched = completeness === 'incomplete';

  return (
    <BillDetailsSection
      title="Vendor"
      completeness={completeness}
      action={
        <Button variant="secondary" size="sm" type="button">
          Create new vendor
        </Button>
      }
    >
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
