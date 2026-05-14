import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';

const mockSetTheme = vi.fn();

vi.mock('@/store/appStore', () => ({
  useAppStore: (sel: any) => {
    const state = { theme: 'light', setTheme: mockSetTheme };
    return typeof sel === 'function' ? sel(state) : state;
  },
}));

describe('ThemeToggle', () => {
  it('renders three theme mode buttons', () => {
    render(<ThemeToggle />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('renders light mode button with accessible label', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
  });

  it('highlights active theme', () => {
    render(<ThemeToggle />);
    const lightBtn = screen.getByRole('button', { name: /light/i });
    expect(lightBtn.className).toContain('bg-primary-500');
  });
});
