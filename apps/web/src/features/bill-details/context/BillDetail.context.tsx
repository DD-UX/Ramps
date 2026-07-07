'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  BillEditFormSchema,
  type BillDetailType,
  type BillEditFormType,
} from '@ramps/schemas/bills';
import type { BillDetailRefsType } from '@ramps/schemas/bill-refs';
import type { UserType } from '@ramps/schemas/users';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';

import { billToFormDefaults } from '../helpers/form-defaults.helpers';

/**
 * The one client-side source of truth for the whole `/bills/:id` screen.
 *
 * Every section (`BillDetailVendor`, `BillDetailLineItems`, …) is an independent
 * component that reads/writes its own slice of the *same* react-hook-form
 * instance — the context hands out the form's getters/setters as-is, so a
 * section stays ignorant of its siblings (SCP). Initial values are hydrated from
 * Supabase on the server and passed down as `bill`; the read-only reference
 * catalogs (vendors, GL accounts, …) ride along on `refs`.
 */
export interface BillDetailContextValue {
  /** The react-hook-form instance seeded from the fetched bill. */
  form: UseFormReturn<BillEditFormType>;
  /** The immutable, fully-typed bill as fetched — status, names, document, etc. */
  bill: BillDetailType;
  /** Dropdown catalogs for the coding grid and pickers. */
  refs: BillDetailRefsType;
  /** The people directory — the approver catalog behind the ApprovalsWorkflow. */
  users: UserType[];
}

const BillDetailContext = createContext<BillDetailContextValue | null>(null);

export interface BillDetailProviderProps {
  bill: BillDetailType;
  refs: BillDetailRefsType;
  users: UserType[];
  // Required + never storied (a provider wrapping no tree is meaningless):
  // explicit `children` over PropsWithChildren is the deliberate, stricter contract.
  children: ReactNode;
}

/**
 * Creates the form instance once per bill and shares it with every section.
 * Validation is the same zod schema the entity is defined by, narrowed to the
 * edit scope (`BillEditFormSchema`), so the form can never drift from the SSoT.
 */
export function BillDetailProvider({ bill, refs, users, children }: BillDetailProviderProps) {
  const form = useForm<BillEditFormType>({
    resolver: zodResolver(BillEditFormSchema),
    defaultValues: billToFormDefaults(bill),
    mode: 'onBlur',
  });

  const value = useMemo<BillDetailContextValue>(
    () => ({ form, bill, refs, users }),
    [form, bill, refs, users],
  );

  // Two providers, one form: `BillDetailContext` carries bill + refs (and the
  // form for whole-form work like submit), while RHF's own `FormProvider` lets
  // each field bind by name via `useFormContext` without prop-drilling.
  return (
    <BillDetailContext.Provider value={value}>
      <FormProvider {...form}>{children}</FormProvider>
    </BillDetailContext.Provider>
  );
}

/** Read the shared form + bill + refs. Throws if used outside the provider. */
export function useBillDetail(): BillDetailContextValue {
  const ctx = useContext(BillDetailContext);
  if (!ctx) {
    throw new Error('useBillDetail must be used within a <BillDetailProvider>.');
  }
  return ctx;
}
