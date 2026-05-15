import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import ThemeToggle from '../ThemeToggle';

const mockSetTheme = vi.hoisted(() => vi.fn());

vi.mock('@/store/appStore', () => (globalThis as any).__createMockAppStore({ theme: 'light', setTheme: mockSetTheme }));

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

  it('calls setTheme when dark mode button is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('button', { name: /dark/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme when reduced mode button is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('button', { name: /reduced colors/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('reduced');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ThemeToggle />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
