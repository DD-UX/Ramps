'use client';

import { Button } from '@ramps/ui/Button';
import { FieldError } from '@ramps/ui/FieldError';
import { Modal } from '@ramps/ui/Modal';

import { useBillDetail } from '../context/BillDetail.context';
import { isPaymentComplete } from '../helpers/payment-completeness.helpers';
import { useSchedulePayment } from '../hooks/useSchedulePayment';
import { BillDetailsPaymentAccount } from './BillDetailsPaymentAccount';
import { PaymentScheduleControl } from './BillDetailsPaymentSchedule';

/**
 * BillDetailsScheduleModal — the "When do you want to pay this bill?" dialog
 * (frame 13), the money-movement step lifted OUT of the inline form.
 *
 * Two modes over the SAME payment slice on the detail context, so what the user
 * picks here is the very state Approve/Schedule read:
 *  - `mode="schedule"` (an `approved` bill) — editable. The footer's primary
 *    books the payment via {@link useSchedulePayment}; it stays disabled until
 *    the slice is complete (a pay-from account + a resolved date) and closes on
 *    success. The hook's inline error surfaces beside Cancel.
 *  - `mode="view"` (a `scheduled` bill) — READ-ONLY "View schedule". The slice
 *    was seeded from the booked payment, the inputs are frozen, and the footer
 *    is a single "Close". No write path.
 *
 * The account picker is frozen in view mode by wrapping the body in a disabled
 * `<fieldset>` — the same native lock the form uses — while the segmented
 * schedule control takes an explicit `readOnly` (a fieldset can't stop its tab
 * switch). Presentation only: all the flow lives in the hook + the slice.
 */
export interface BillDetailsScheduleModalProps {
  open: boolean;
  onClose: () => void;
  /** `schedule` books a payment; `view` shows the booked one read-only. */
  mode: 'schedule' | 'view';
}

export function BillDetailsScheduleModal({ open, onClose, mode }: BillDetailsScheduleModalProps) {
  const { payment, setPayment } = useBillDetail();
  const { schedule, submitting, error } = useSchedulePayment();
  const readOnly = mode === 'view';

  const onSchedule = async () => {
    const ok = await schedule();
    if (ok) onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Header>{readOnly ? 'Payment schedule' : 'Schedule payment'}</Modal.Header>
      <Modal.Body>
        {/* One disabled fieldset freezes every nested input/select natively in
            view mode — the same lock the detail form applies — so the account
            picker needs no readOnly prop of its own. */}
        <fieldset disabled={readOnly} className="contents">
          <BillDetailsPaymentAccount />
          <PaymentScheduleControl
            schedule={payment.schedule}
            payDate={payment.payDate}
            onScheduleChange={(next) => setPayment({ schedule: next })}
            onPayDateChange={(payDate) => setPayment({ payDate })}
            readOnly={readOnly}
          />
        </fieldset>
      </Modal.Body>
      <Modal.Footer>
        {readOnly ? (
          <>
            <span />
            <Button type="button" variant="primary" onClick={onClose}>
              Close
            </Button>
          </>
        ) : (
          <>
            <div className="gap-rui-3 flex items-center">
              <Button type="button" variant="underline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <FieldError size="sm">{error}</FieldError>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => void onSchedule()}
              disabled={submitting || !isPaymentComplete(payment)}
            >
              {submitting ? 'Scheduling…' : 'Schedule payment'}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}
