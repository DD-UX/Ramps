import { describe, expect, it, vi } from 'vitest';

import {
  FOOTER_ACTION,
  FOOTER_ACTION_STRATEGIES,
  resolveFooterAction,
} from './footer-action.constants';

/** Typed mock deps — structurally a FooterActionDeps, spies included. */
function deps() {
  return {
    save: vi.fn<(opts: { exitEditMode: boolean }) => void>(),
    toggleEditable: vi.fn<(next: boolean) => void>(),
  };
}

describe('resolveFooterAction', () => {
  it('pre-submit bills always author drafts, whatever the edit toggle says', () => {
    expect(resolveFooterAction({ preSubmit: true, editableStatus: true, editable: true })).toBe(
      FOOTER_ACTION.SAVE_DRAFT,
    );
    expect(resolveFooterAction({ preSubmit: true, editableStatus: true, editable: false })).toBe(
      FOOTER_ACTION.SAVE_DRAFT,
    );
  });

  it('an editable-but-submitted bill at rest offers Edit bill; mid-edit it offers Save bill', () => {
    // e.g. awaiting_approval: editableStatus true, not pre-submit.
    expect(resolveFooterAction({ preSubmit: false, editableStatus: true, editable: false })).toBe(
      FOOTER_ACTION.EDIT_BILL,
    );
    expect(resolveFooterAction({ preSubmit: false, editableStatus: true, editable: true })).toBe(
      FOOTER_ACTION.SAVE_BILL,
    );
  });

  it('a LOCKED bill (approved onward) has no left action, whatever the toggle says', () => {
    expect(resolveFooterAction({ preSubmit: false, editableStatus: false, editable: false })).toBeNull();
    expect(resolveFooterAction({ preSubmit: false, editableStatus: false, editable: true })).toBeNull();
  });
});

describe('FOOTER_ACTION_STRATEGIES', () => {
  it('Save draft saves WITHOUT leaving edit mode', () => {
    const d = deps();
    FOOTER_ACTION_STRATEGIES[FOOTER_ACTION.SAVE_DRAFT].run(d);
    expect(d.save).toHaveBeenCalledWith({ exitEditMode: false });
    expect(d.toggleEditable).not.toHaveBeenCalled();
  });

  it('Save bill saves AND exits edit mode on success', () => {
    const d = deps();
    FOOTER_ACTION_STRATEGIES[FOOTER_ACTION.SAVE_BILL].run(d);
    expect(d.save).toHaveBeenCalledWith({ exitEditMode: true });
  });

  it('Edit bill only flips edit mode on — it never saves', () => {
    const d = deps();
    FOOTER_ACTION_STRATEGIES[FOOTER_ACTION.EDIT_BILL].run(d);
    expect(d.toggleEditable).toHaveBeenCalledWith(true);
    expect(d.save).not.toHaveBeenCalled();
  });

  it('only saving strategies advertise a busy label', () => {
    expect(FOOTER_ACTION_STRATEGIES[FOOTER_ACTION.SAVE_DRAFT].busyLabel).not.toBeNull();
    expect(FOOTER_ACTION_STRATEGIES[FOOTER_ACTION.SAVE_BILL].busyLabel).not.toBeNull();
    expect(FOOTER_ACTION_STRATEGIES[FOOTER_ACTION.EDIT_BILL].busyLabel).toBeNull();
  });
});
