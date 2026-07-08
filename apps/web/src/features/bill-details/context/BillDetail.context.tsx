'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { BillDetailRefsType } from '@ramps/schemas/bill-refs';
import {
  type BillDetailType,
  BillEditFormSchema,
  type BillEditFormType,
} from '@ramps/schemas/bills';
import type { UserType } from '@ramps/schemas/users';
import { createContext, type ReactNode, type RefObject, useContext, useMemo, useRef } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';

import { billToFormDefaults } from '../helpers/form-defaults.helpers';

/**
 * The one client-side source of truth for the whole `/bills/:id` screen.
 *
 * Every section (`BillDetailVendor`, `BillDetailLineItems`, …) is an independent
 * component that reads/writes its own slice of the *same* react-hook-form
 * instance — the context hands out the form's getters/setters as-is, so a
 * section stays ignorant of its siblings (SCP). Everything read on the server is
 * seeded here: the bill itself (`bill`), the read-only reference catalogs
 * (`refs`), the approver directory (`users`), and the invoice's resolved public
 * URL (`documentUrl`) — so any descendant reads what it needs off the context
 * rather than being prop-drilled to.
 *
 * RULE OF THUMB (server → client flow): wherever a provider exists, any
 * server-resolved data that shares this screen's concern is passed *into the
 * context*, never drilled through the tree. The provider delivers it straight to
 * the one consumer that needs it, so intervening layers stay ignorant of props
 * they only forward. The only thing that must NOT move here is a computation that
 * needs a server-only secret (e.g. `documentUrl` is resolved on the RSC page —
 * `SUPABASE_URL` is server-only — and only the finished string crosses over).
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
  /**
   * The invoice PDF's absolute public URL, or `null` when the bill has none.
   * Resolved on the server (the storage base is a server-only secret) and shared
   * here so the document pane — the one consumer — reads it off the context
   * instead of it being drilled through the intervening layout.
   */
  documentUrl: string | null;
  /**
   * The split's LEFT PANE scroll container (the DraggablePanel's left side).
   * Shared so floating pickers in the form — e.g. the approver popover — can
   * reframe within the pane instead of spilling across the divider into the
   * invoice preview. Null until the panel mounts.
   */
  leftPaneRef: RefObject<HTMLDivElement | null>;
}

const BillDetailContext = createContext<BillDetailContextValue | null>(null);

export interface BillDetailProviderProps {
  bill: BillDetailType;
  refs: BillDetailRefsType;
  users: UserType[];
  documentUrl: string | null;
  // Required + never storied (a provider wrapping no tree is meaningless):
  // explicit `children` over PropsWithChildren is the deliberate, stricter contract.
  children: ReactNode;
}

/**
 * Creates the form instance once per bill and shares it with every section.
 * Validation is the same zod schema the entity is defined by, narrowed to the
 * edit scope (`BillEditFormSchema`), so the form can never drift from the SSoT.
 */
export function BillDetailProvider({
  bill,
  refs,
  users,
  documentUrl,
  children,
}: BillDetailProviderProps) {
  const form = useForm<BillEditFormType>({
    resolver: zodResolver(BillEditFormSchema),
    defaultValues: billToFormDefaults(bill),
    mode: 'onBlur',
  });

  // The split's left-pane node, filled once BillDetailsContent hands this ref to
  // the DraggablePanel. A stable ref object, so consumers read a live `.current`.
  const leftPaneRef = useRef<HTMLDivElement>(null);

  const value = useMemo<BillDetailContextValue>(
    () => ({ form, bill, refs, users, documentUrl, leftPaneRef }),
    [form, bill, refs, users, documentUrl],
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

/**
 * Read the shared context — the form plus everything seeded on the server
 * (`bill`, `refs`, `users`, `documentUrl`) and the split's `leftPaneRef`.
 * Throws if used outside the provider.
 */
export function useBillDetail(): BillDetailContextValue {
  const ctx = useContext(BillDetailContext);
  if (!ctx) {
    throw new Error('useBillDetail must be used within a <BillDetailProvider>.');
  }
  return ctx;
}
