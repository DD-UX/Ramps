import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CommonUnsavedChangesGuard } from './CommonUnsavedChangesGuard';

/**
 * The guard's contract: a document-capture click listener vetoes in-app link
 * navigations while `isDirty()` holds, parks the destination and opens the DS
 * Modal with Save draft / Leave / Cancel. These tests drive real anchor clicks
 * through jsdom and assert the veto (defaultPrevented), the three exits, and
 * the pass-through cases (clean form, modified clicks, external links).
 */
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

afterEach(() => {
  push.mockReset();
});

function renderWithLink(ui: React.ReactElement, href = '/bills') {
  const view = render(
    <>
      {ui}
      <a href={href}>Go to bills</a>
    </>,
  );
  return { ...view, link: screen.getByText('Go to bills') };
}

describe('CommonUnsavedChangesGuard', () => {
  it('lets a clean navigation pass through untouched', () => {
    const { link } = renderWithLink(
      <CommonUnsavedChangesGuard isDirty={() => false} onSave={async () => true} />,
    );
    const passed = fireEvent.click(link);
    expect(passed, 'click not prevented').toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('vetoes a dirty navigation and opens the save-or-leave modal', () => {
    const { link } = renderWithLink(
      <CommonUnsavedChangesGuard isDirty={() => true} onSave={async () => true} />,
    );
    const passed = fireEvent.click(link);
    expect(passed, 'click was prevented').toBe(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('ignores modified clicks (new-tab intent) even when dirty', () => {
    const { link } = renderWithLink(
      <CommonUnsavedChangesGuard isDirty={() => true} onSave={async () => true} />,
    );
    fireEvent.click(link, { metaKey: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Leave discards and completes the parked navigation', () => {
    const { link } = renderWithLink(
      <CommonUnsavedChangesGuard isDirty={() => true} onSave={async () => true} />,
    );
    fireEvent.click(link);
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    expect(push).toHaveBeenCalledWith('/bills');
  });

  it('Save draft persists first, then navigates on success', async () => {
    const onSave = vi.fn(async () => true);
    const { link } = renderWithLink(
      <CommonUnsavedChangesGuard isDirty={() => true} onSave={onSave} />,
    );
    fireEvent.click(link);
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/bills'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('stays put (modal open, error shown) when the save fails', async () => {
    const onSave = vi.fn(async () => false);
    const { link } = renderWithLink(
      <CommonUnsavedChangesGuard isDirty={() => true} onSave={onSave} />,
    );
    fireEvent.click(link);
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() =>
      expect(
        screen.getByText('Could not save. Resolve the issue, or leave without saving.'),
      ).toBeInTheDocument(),
    );
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Cancel keeps the user on the page without navigating', () => {
    const { link } = renderWithLink(
      <CommonUnsavedChangesGuard isDirty={() => true} onSave={async () => true} />,
    );
    fireEvent.click(link);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(push).not.toHaveBeenCalled();
  });
});
