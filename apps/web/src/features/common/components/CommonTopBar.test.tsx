import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CommonTopBar } from './CommonTopBar';

/**
 * CommonTopBar is a pure layout shell: an optional <h1> title on the left, a
 * children slot, and the current user's Avatar pinned right. No logic, no
 * hooks — these tests pin the composition: the title renders as a heading only
 * when supplied, children pass through, the avatar carries the user's name for
 * assistive tech, and a caller className is merged onto the base classes.
 */
describe('CommonTopBar', () => {
  it('renders the title as a heading when supplied', () => {
    render(<CommonTopBar title="Bill Pay" />);
    expect(screen.getByRole('heading', { name: 'Bill Pay' })).toBeInTheDocument();
  });

  it('omits the heading entirely when no title is given', () => {
    render(<CommonTopBar />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('always renders the current user avatar labelled with their name', () => {
    render(<CommonTopBar />);
    expect(screen.getByLabelText('Diego Diaz')).toBeInTheDocument();
  });

  it('passes children through into the right slot', () => {
    render(
      <CommonTopBar title="Bill Pay">
        <button type="button">New bill</button>
      </CommonTopBar>,
    );
    expect(screen.getByRole('button', { name: 'New bill' })).toBeInTheDocument();
  });

  it('merges a caller className onto the header', () => {
    const { container } = render(<CommonTopBar className="custom-topbar" />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('custom-topbar');
    // The base layout classes survive the merge.
    expect(header).toHaveClass('flex', 'items-center', 'justify-between');
  });
});
