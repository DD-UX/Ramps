import { type LucideIcon, Pencil, Save } from '@ramps/ui/icons';

/**
 * The footer's LEFT-slot action, as a strategy table — the "which button is
 * this?" decision was a chained ternary growing inside the form's JSX; here
 * each lifecycle mode is one declarative entry and the form just renders
 * whichever the resolver picks (the house style: lookup maps, not ternary
 * chains).
 *
 * Three modes cover the bill's lifecycle:
 * - `save_draft` — pre-submit bills (draft / missing_info): the authoring
 *   footer, fields always editable.
 * - `edit_bill` — post-submit bills at rest: the screen is read-only and this
 *   action flips the context's `editable` on.
 * - `save_bill` — post-submit bills mid-edit: persists, then flips `editable`
 *   back off so the screen returns to its frozen record state.
 *
 * Each strategy carries its own `run` over the deps the form injects (`save`,
 * `toggleEditable`), so the FORM stays a dumb renderer: adding a mode means
 * adding a row here, not another branch there.
 */
export const FOOTER_ACTION = {
  SAVE_DRAFT: 'save_draft',
  SAVE_BILL: 'save_bill',
  EDIT_BILL: 'edit_bill',
} as const;

export type FooterAction = (typeof FOOTER_ACTION)[keyof typeof FOOTER_ACTION];

/** What a strategy's `run` gets to work with — injected by the form. */
export interface FooterActionDeps {
  /** The shared save flow; `exitEditMode` snaps the screen back to read-only on success. */
  save: (opts: { exitEditMode: boolean }) => void;
  /** The context's edit-mode switch. */
  toggleEditable: (next: boolean) => void;
}

export interface FooterActionStrategy {
  /** Resting button label. */
  label: string;
  /** Label while the save is in flight — null when the action never saves. */
  busyLabel: string | null;
  /** Leading glyph (component ref, rendered by the form at its own size). */
  Icon: LucideIcon;
  /** What pressing the button does, over the injected deps. */
  run: (deps: FooterActionDeps) => void;
}

export const FOOTER_ACTION_STRATEGIES: Record<FooterAction, FooterActionStrategy> = {
  [FOOTER_ACTION.SAVE_DRAFT]: {
    label: 'Save draft',
    busyLabel: 'Saving…',
    Icon: Save,
    run: ({ save }) => save({ exitEditMode: false }),
  },
  [FOOTER_ACTION.SAVE_BILL]: {
    label: 'Save bill',
    busyLabel: 'Saving…',
    Icon: Save,
    run: ({ save }) => save({ exitEditMode: true }),
  },
  [FOOTER_ACTION.EDIT_BILL]: {
    label: 'Edit bill',
    busyLabel: null,
    Icon: Pencil,
    run: ({ toggleEditable }) => toggleEditable(true),
  },
};

/**
 * Pick the footer's left action for the current lifecycle mode: pre-submit
 * bills always author drafts; past that, the edit toggle decides between
 * entering edit mode and saving out of it.
 */
export function resolveFooterAction({
  preSubmit,
  editable,
}: {
  preSubmit: boolean;
  editable: boolean;
}): FooterAction {
  if (preSubmit) return FOOTER_ACTION.SAVE_DRAFT;
  return editable ? FOOTER_ACTION.SAVE_BILL : FOOTER_ACTION.EDIT_BILL;
}
