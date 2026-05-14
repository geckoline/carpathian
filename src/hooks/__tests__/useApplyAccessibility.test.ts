import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useApplyAccessibility } from '../useApplyAccessibility';
import { useAppStore } from '@/store/appStore';

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(() => [null, vi.fn()]),
}));

describe('useApplyAccessibility', () => {
  beforeEach(() => {
    document.documentElement.style.fontSize = '';
    document.documentElement.classList.remove('high-contrast', 'reduced-motion-forced', 'theme-light', 'theme-dark', 'theme-reduced-color', 'dark');
    localStorage.removeItem('ccs-a11y-settings');
  });

  it('applies font size to root element', () => {
    vi.mocked(useAppStore).mockReturnValue({
      a11y: { fontSize: 20, highContrast: false, reducedMotion: false },
      theme: 'light',
      setA11y: vi.fn(),
    });
    renderHook(() => useApplyAccessibility());
    expect(document.documentElement.style.fontSize).toBe('20px');
  });

  it('adds high-contrast class when enabled', () => {
    vi.mocked(useAppStore).mockReturnValue({
      a11y: { fontSize: 16, highContrast: true, reducedMotion: false },
      theme: 'light',
      setA11y: vi.fn(),
    });
    renderHook(() => useApplyAccessibility());
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
  });

  it('adds reduced-motion-forced class when enabled', () => {
    vi.mocked(useAppStore).mockReturnValue({
      a11y: { fontSize: 16, highContrast: false, reducedMotion: true },
      theme: 'light',
      setA11y: vi.fn(),
    });
    renderHook(() => useApplyAccessibility());
    expect(document.documentElement.classList.contains('reduced-motion-forced')).toBe(true);
  });

  it('removes high-contrast class when disabled', () => {
    document.documentElement.classList.add('high-contrast');
    vi.mocked(useAppStore).mockReturnValue({
      a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
      theme: 'light',
      setA11y: vi.fn(),
    });
    renderHook(() => useApplyAccessibility());
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
  });

  it('applies theme classes to the root element', () => {
    vi.mocked(useAppStore).mockReturnValue({
      a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
      theme: 'dark',
      setA11y: vi.fn(),
      setTheme: vi.fn(),
    });

    renderHook(() => useApplyAccessibility());

    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
  });

  it('keeps font scaling, high contrast, reduced motion, and theme classes active together', () => {
    vi.mocked(useAppStore).mockReturnValue({
      a11y: { fontSize: 22, highContrast: true, reducedMotion: true },
      theme: 'dark',
      setA11y: vi.fn(),
      setTheme: vi.fn(),
    });

    renderHook(() => useApplyAccessibility());

    expect(document.documentElement.style.fontSize).toBe('22px');
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    expect(document.documentElement.classList.contains('reduced-motion-forced')).toBe(true);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
