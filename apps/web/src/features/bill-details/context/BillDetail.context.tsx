'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { SaveApprovalStagesType } from '@ramps/schemas/approvals';
import type { BillDetailRefsType } from '@ramps/schemas/bill-refs';
import {
  type BillDetailType,
  BillEditFormSchema,
  type BillEditFormType,
} from '@ramps/schemas/bills';
import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';

import { isBillPreSubmit } from '../constants/pre-submit.constants';
import { billToFormDefaults } from '../helpers/form-defaults.helpers';

/**
 * The one client-side source of truth for the whole `/bills/:id` screen.
 *
 * Every section (`BillDetailVendor`, `BillDetailLineItems`, …) is an independent
 * component that reads/writes its own slice of the *same* react-hook-form
 * instance — the context hands out the form's getters/setters as-is, so a
 * section stays ignorant of its siblings (SCP). What's read on the server and
 * belongs to *this* bill is seeded here: the bill itself (`bill`), the read-only
 * reference catalogs (`refs`), and the invoice's resolved public URL
 * (`documentUrl`) — so any descendant reads what it needs off the context rather
 * than being prop-drilled to.
 *
 * RULE OF THUMB (server → client flow): wherever a provider exists, any
 * server-resolved data that shares this screen's concern is passed *into the
 * context*, never drilled through the tree. The provider delivers it straight to
 * the one consumer that needs it, so intervening layers stay ignorant of props
 * they only forward. Two carve-outs: (1) a computation that needs a server-only
 * secret can't move here — `documentUrl` is resolved on the RSC page because
 * `SUPABASE_URL` is server-only, and only the finished string crosses over; and
 * (2) data that is *app-wide, not per-bill* belongs in its own cache, not this
 * context — the approver directory is server-seeded into the SWR cache and read
 * via `useApproverCandidateUsers()`, so it stays shared across screens.
 */
export interface BillDetailContextValue {
  /** The react-hook-form instance seeded from the fetched bill. */
  form: UseFormReturn<BillEditFormType>;
  /** The immutable, fully-typed bill as fetched — status, names, document, etc. */
  bill: BillDetailType;
  /** Dropdown catalogs for the coding grid and pickers. */
  refs: BillDetailRefsType;
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
  /**
   * The approvals section's UNSAVED route, staged for the footer's "Save draft"
   * action. The chain editor stashes each edit here (already mapped to the save
   * payload) instead of persisting it; Save draft reads it, PUTs it, and clears
   * it on success. Null when the on-screen chain matches what's persisted. A
   * ref, not state — nothing re-renders on staging; only the save action reads.
   */
  pendingApprovalStagesRef: RefObject<SaveApprovalStagesType | null>;
  /**
   * Whether the screen's fields accept input right now. Pre-submit bills
   * (`draft` / `missing_info`) open editable and stay so; anything past that
   * opens READ-ONLY and only becomes editable through the footer's "Edit bill"
   * action. The form renders this as one `<fieldset disabled>` around the
   * sections, so every input/select/button inside inherits the lock natively.
   */
  editable: boolean;
  /** Flip the edit mode — "Edit bill" passes true, a successful save passes false. */
  toggleEditable: (next: boolean) => void;
}

const BillDetailContext = createContext<BillDetailContextValue | null>(null);

export interface BillDetailProviderProps {
  bill: BillDetailType;
  refs: BillDetailRefsType;
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
export function BillDetailProvider({ bill, refs, documentUrl, children }: BillDetailProviderProps) {
  const form = useForm<BillEditFormType>({
    resolver: zodResolver(BillEditFormSchema),
    defaultValues: billToFormDefaults(bill),
    mode: 'onBlur',
  });

  // The split's left-pane node, filled once BillDetailsContent hands this ref to
  // the DraggablePanel. A stable ref object, so consumers read a live `.current`.
  const leftPaneRef = useRef<HTMLDivElement>(null);

  // The approvals route staged-but-unsaved by the chain editor, awaiting the
  // footer's "Save draft". Stable ref: staging an edit must not re-render.
  const pendingApprovalStagesRef = useRef<SaveApprovalStagesType | null>(null);

  // Edit mode: pre-submit bills are the author view and open editable;
  // everything past that opens read-only until the footer's "Edit bill" flips
  // it. Initializer-only state is safe here — the provider is keyed by
  // bill.id upstream, so a rail hop remounts it and re-derives from the NEW
  // bill's status rather than carrying the previous record's mode.
  const [editable, setEditable] = useState(() => isBillPreSubmit(bill.status));
  const toggleEditable = useCallback((next: boolean) => setEditable(next), []);

  const value = useMemo<BillDetailContextValue>(
    () => ({
      form,
      bill,
      refs,
      documentUrl,
      leftPaneRef,
      pendingApprovalStagesRef,
      editable,
      toggleEditable,
    }),
    [form, bill, refs, documentUrl, editable, toggleEditable],
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
 * (`bill`, `refs`, `documentUrl`) and the split's `leftPaneRef`.
 * Throws if used outside the provider.
 */
export function useBillDetail(): BillDetailContextValue {
  const ctx = useContext(BillDetailContext);
  if (!ctx) {
    throw new Error('useBillDetail must be used within a <BillDetailProvider>.');
  }
  return ctx;
}
