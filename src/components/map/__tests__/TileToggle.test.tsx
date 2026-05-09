import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TileToggle from '../TileToggle';

describe('TileToggle', () => {
  it('renders layer toggle buttons', () => {
    render(<TileToggle activeLayer="street" onLayerChange={vi.fn()} />);
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Map layer toggle');
    expect(screen.getByTitle('Street View')).toBeInTheDocument();
    expect(screen.getByTitle('Satellite View')).toBeInTheDocument();
  });

  it('highlights active layer button', () => {
    const { rerender } = render(<TileToggle activeLayer="street" onLayerChange={vi.fn()} />);
    expect(screen.getByTitle('Street View')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTitle('Satellite View')).toHaveAttribute('aria-pressed', 'false');

    rerender(<TileToggle activeLayer="satellite" onLayerChange={vi.fn()} />);
    expect(screen.getByTitle('Street View')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTitle('Satellite View')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onLayerChange with the selected layer on click', async () => {
    const onLayerChange = vi.fn();
    render(<TileToggle activeLayer="street" onLayerChange={onLayerChange} />);

    await userEvent.click(screen.getByTitle('Satellite View'));
    expect(onLayerChange).toHaveBeenCalledWith('satellite');

    await userEvent.click(screen.getByTitle('Street View'));
    expect(onLayerChange).toHaveBeenCalledWith('street');
  });
});
