import type { BillDetailRefsType } from '@ramps/schemas/bill-refs';
import type { BillDetailType } from '@ramps/schemas/bills';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  BILL_DETAIL_DATA_LEVEL,
  type BillDetailDataLevel,
} from '../constants/data-level.constants';
import { billDetailPlaceholder } from '../helpers/bill-seed.helpers';
import { BillDetailProvider, useBillDetail } from './BillDetail.context';

/**
 * The provider's LADDER CONTRACT, pinned: a climb (skeleton → seed → full)
 * re-derives everything seeded from the poorer record — in place, not a
 * remount — while a same-level replacement (a background revalidation at
 * `full`) deliberately re-derives NOTHING, so a revalidation can never yank a
 * form out from under a mid-edit user. And below `full`, `editable` is forced
 * off whatever the status says — a save from a partial form would erase the
 * lines the seed never had.
 *
 * Fixtures come from the real seed helpers, so the test walks the same rungs
 * the screen does. The wrapper reads the current rung off a scenario slot the
 * test bodies set BETWEEN renders (never during one), so `rerender()` replays
 * the provider with the new bill + level like the screen's own prop updates.
 */
const BILL_ID = 'b0000000-0000-0000-0000-00000000d001';

// The provider only forwards `refs` — an empty catalog stands in fine.
const refs = {} as BillDetailRefsType;

/** The fetched record a climb lands on: a pre-submit draft with real fields. */
const fullBill: BillDetailType = {
  ...billDetailPlaceholder(BILL_ID),
  memo: 'Quarterly retainer',
  vendor_name: 'Trashlab Supply Co.',
  status: 'draft',
};

let scenario: { bill: BillDetailType; dataLevel: BillDetailDataLevel };

beforeEach(() => {
  scenario = { bill: billDetailPlaceholder(BILL_ID), dataLevel: BILL_DETAIL_DATA_LEVEL.SKELETON };
});

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <BillDetailProvider
      bill={scenario.bill}
      refs={refs}
      documentUrl={null}
      dataLevel={scenario.dataLevel}
    >
      {children}
    </BillDetailProvider>
  );
}

function mountLadder() {
  const view = renderHook(() => useBillDetail(), { wrapper: Wrapper });
  return {
    ctx: () => view.result.current,
    setLevel: (dataLevel: BillDetailDataLevel, bill: BillDetailType) => {
      scenario = { bill, dataLevel };
      view.rerender();
    },
  };
}

describe('BillDetailProvider ladder', () => {
  it('forces editable off below full, even for a pre-submit status', () => {
    const { ctx } = mountLadder();
    // The placeholder says `draft` (pre-submit → would open editable), but a
    // partial bill is never editable.
    expect(ctx().editable).toBe(false);
  });

  it('a climb re-derives the form and edit mode from the richer record', () => {
    const { ctx, setLevel } = mountLadder();
    expect(ctx().form.getValues('memo')).toBe('');

    setLevel(BILL_DETAIL_DATA_LEVEL.FULL, fullBill);

    // Form reset to the fetched record's defaults…
    expect(ctx().form.getValues('memo')).toBe('Quarterly retainer');
    // …and edit mode re-derived from ITS status: draft opens editable.
    expect(ctx().editable).toBe(true);
  });

  it('a same-level replacement resets nothing — a revalidation must not clobber a mid-edit form', () => {
    const { ctx, setLevel } = mountLadder();
    setLevel(BILL_DETAIL_DATA_LEVEL.FULL, fullBill);
    // The user types into the form…
    act(() => ctx().form.setValue('memo', 'user-typed edit', { shouldDirty: true }));

    // …then a background revalidation replaces the bill at the SAME level.
    setLevel(BILL_DETAIL_DATA_LEVEL.FULL, { ...fullBill, memo: 'server drifted' });

    // The typed value survives — the form was NOT reset to the drifted record.
    // (formState.isDirty isn't asserted: it's a render-subscription Proxy, and
    // this probe never subscribes; the surviving value is the contract.)
    expect(ctx().form.getValues('memo')).toBe('user-typed edit');
  });
});
