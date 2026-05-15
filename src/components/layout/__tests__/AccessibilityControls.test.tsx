import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import AccessibilityControls from '../AccessibilityControls';

const createMockAppStore = vi.hoisted(() => (globalThis as any).__createMockAppStore);
const mockSetA11y = vi.hoisted(() => vi.fn());

vi.mock('@/store/appStore', () => createMockAppStore({ setA11y: mockSetA11y }));

describe('AccessibilityControls', () => {
  beforeEach(() => { mockSetA11y.mockClear(); });

  it('renders settings button', () => {
    render(<AccessibilityControls />);
    expect(screen.getByLabelText('Accessibility settings')).toBeInTheDocument();
  });

  it('opens modal on settings click', async () => {
    const user = userEvent.setup();
    render(<AccessibilityControls />);
    await user.click(screen.getByLabelText('Accessibility settings'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Accessibility Settings')).toBeInTheDocument();
  });

  it('shows font size slider in modal', async () => {
    const user = userEvent.setup();
    render(<AccessibilityControls />);
    await user.click(screen.getByLabelText('Accessibility settings'));
    expect(screen.getByRole('slider', { name: 'Font size' })).toBeInTheDocument();
  });

  it('calls setA11y when slider value changes', async () => {
    const user = userEvent.setup();
    render(<AccessibilityControls />);
    await user.click(screen.getByLabelText('Accessibility settings'));
    const range = screen.getByRole('slider');
    fireEvent.change(range, { target: { value: '20' } });
    expect(mockSetA11y).toHaveBeenCalledWith({ fontSize: 20 });
  });

  it('updates font size from range input events', async () => {
    const user = userEvent.setup();
    render(<AccessibilityControls />);
    await user.click(screen.getByLabelText('Accessibility settings'));
    const range = screen.getByRole('slider', { name: 'Font size' });
    fireEvent.input(range, { target: { value: '22' } });
    expect(mockSetA11y).toHaveBeenCalledWith({ fontSize: 22 });
  });

  it('shows toggle switches with aria-checked', async () => {
    const user = userEvent.setup();
    render(<AccessibilityControls />);
    await user.click(screen.getByLabelText('Accessibility settings'));
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(2);
    expect(switches[0]).toHaveAttribute('aria-checked', 'false');
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles high contrast on click', async () => {
    const user = userEvent.setup();
    render(<AccessibilityControls />);
    await user.click(screen.getByLabelText('Accessibility settings'));
    const switches = screen.getAllByRole('switch');
    await user.click(switches[0]!);
    expect(mockSetA11y).toHaveBeenCalledWith({ highContrast: true });
  });

  it('toggles reduced motion on click', async () => {
    const user = userEvent.setup();
    render(<AccessibilityControls />);
    await user.click(screen.getByLabelText('Accessibility settings'));
    const switches = screen.getAllByRole('switch');
    await user.click(switches[1]!);
    expect(mockSetA11y).toHaveBeenCalledWith({ reducedMotion: true });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<AccessibilityControls />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
