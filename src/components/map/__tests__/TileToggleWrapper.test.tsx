import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TileToggleWrapper from '../TileToggleWrapper';

const addLayer = vi.fn();
const removeLayer = vi.fn();

vi.mock('react-leaflet', () => ({
  useMap: () => ({ addLayer, removeLayer }),
}));

describe('TileToggleWrapper', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('adds street tile layer to map on mount', () => {
    render(<TileToggleWrapper />);
    expect(addLayer).toHaveBeenCalledTimes(1);
  });

  it('re-adds street layer on remount (Strict Mode safeguard)', () => {
    const { unmount } = render(<TileToggleWrapper />);
    unmount();
    vi.clearAllMocks();
    render(<TileToggleWrapper />);
    expect(addLayer).toHaveBeenCalledTimes(1);
  });

  it('renders toggle UI and tracks active state', async () => {
    const user = userEvent.setup();
    render(<TileToggleWrapper />);
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Map layer toggle');

    const satBtn = screen.getByTitle('Satellite View');
    await user.click(satBtn);
    expect(satBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
