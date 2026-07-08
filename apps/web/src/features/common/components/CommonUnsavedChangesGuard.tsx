'use client';

import { Button } from '@ramps/ui/Button';
import { FieldError } from '@ramps/ui/FieldError';
import { Modal } from '@ramps/ui/Modal';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * CommonUnsavedChangesGuard — the "save or leave" gate for any screen with
 * unsaved edits (first consumer: the bill drawer's draft form).
 *
 * Mount it once on the screen; it watches every in-app link click from a
 * document-level CAPTURE listener, so it fires before Next's `<Link>` handler
 * and can veto the navigation (`preventDefault`) when `isDirty()` says there's
 * something at stake. The intercepted destination is parked and the DS Modal
 * (frame 13's light-scrim confirmation) asks: **Save draft** (persist, then
 * continue), **Leave** (discard, continue), or Cancel/Esc/scrim (stay).
 *
 * Hard exits (tab close, reload, external URLs) can't show a custom modal —
 * those get the native `beforeunload` prompt instead, same dirtiness check.
 *
 * `isDirty` is a CALLBACK read at click time, not a boolean prop: dirtiness on
 * the bill screen lives partly in a ref (the staged approvals route) that
 * doesn't re-render anything when it changes, so the guard must ask fresh.
 * Clicks with modifier keys, non-left buttons, `target="_blank"`, `download`
 * or cross-origin hrefs pass through untouched — they don't unload this page.
 */
export interface CommonUnsavedChangesGuardProps {
  /** Read when a navigation is attempted — return true to interrupt it. */
  isDirty: () => boolean;
  /**
   * Persist the unsaved work. Resolve `true` on success (the guard then
   * completes the parked navigation) or `false` to stay put (e.g. the save
   * failed — surface details in your own UI; the modal shows a generic line).
   */
  onSave: () => Promise<boolean>;
  /** The persist button's label; defaults to the draft vocabulary. */
  saveLabel?: string;
}

export function CommonUnsavedChangesGuard({
  isDirty,
  onSave,
  saveLabel = 'Save draft',
}: CommonUnsavedChangesGuardProps) {
  const router = useRouter();
  // The destination we intercepted; non-null = the modal is open.
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Keep the listeners stable across renders while always reading fresh state:
  // the latest `isDirty` is mirrored into a ref after every commit, so the
  // one document listener asks the current form, never a stale closure.
  const isDirtyRef = useRef(isDirty);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  });

  useEffect(() => {
    // CAPTURE phase: runs before Next's Link onClick (bubble), which bails
    // when it sees `defaultPrevented` — that's the veto contract.
    function onClickCapture(event: MouseEvent) {
      if (event.defaultPrevented) return;
      // Only plain left-clicks navigate this tab.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target as Element | null;
      const anchor = target?.closest?.('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const rel = anchor.getAttribute('target');
      if ((rel && rel !== '_self') || anchor.hasAttribute('download')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return; // beforeunload's job
      const here = window.location;
      if (url.pathname === here.pathname && url.search === here.search) return; // same page

      if (!isDirtyRef.current()) return;

      event.preventDefault();
      event.stopPropagation();
      setSaveError(null);
      setPendingHref(url.pathname + url.search + url.hash);
    }

    // Hard exits (close, reload, external): the native prompt is all we get.
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirtyRef.current()) return;
      event.preventDefault();
    }

    document.addEventListener('click', onClickCapture, true);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  const close = useCallback(() => {
    if (saving) return; // don't dismiss mid-persist
    setPendingHref(null);
    setSaveError(null);
  }, [saving]);

  // Leave = discard: complete the parked navigation as-is. Navigate FIRST, then
  // drop the modal — the route change unmounts this guard, and ordering the push
  // ahead of the `setPendingHref(null)` render keeps it out of the same commit.
  const leave = useCallback(() => {
    if (!pendingHref) return;
    router.push(pendingHref);
    setPendingHref(null);
  }, [pendingHref, router]);

  // Save draft = persist first; only navigate once the write lands. `onSave`
  // resets the form (clearing `isDirty`), so by the time we push, the guard's
  // click listener won't re-veto. Push BEFORE clearing `pendingHref`: after an
  // await we're in a fresh task, and interleaving the modal-close render with
  // the router push let the navigation get dropped — pushing first, then
  // tearing down, lands the route change reliably.
  const saveAndLeave = useCallback(async () => {
    if (!pendingHref) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await onSave();
      if (saved) {
        router.push(pendingHref);
        setPendingHref(null);
      } else {
        setSaveError('Could not save. Resolve the issue, or leave without saving.');
      }
    } finally {
      setSaving(false);
    }
  }, [onSave, pendingHref, router]);

  return (
    <Modal open={pendingHref !== null} onClose={close}>
      <Modal.Header>Unsaved changes</Modal.Header>
      <Modal.Body>
        <p>
          This bill has edits that haven&apos;t been saved. Save them as a draft before leaving, or
          leave and discard them.
        </p>
        <FieldError size="sm">{saveError}</FieldError>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="underline" onClick={close} disabled={saving}>
          Cancel
        </Button>
        <div className="gap-rui-3 flex items-center">
          <Button type="button" variant="secondary" onClick={leave} disabled={saving}>
            Leave
          </Button>
          <Button type="button" variant="primary" onClick={saveAndLeave} disabled={saving}>
            {saving ? 'Saving…' : saveLabel}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
