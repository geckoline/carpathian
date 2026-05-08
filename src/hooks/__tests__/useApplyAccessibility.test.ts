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
    document.documentElement.classList.remove('high-contrast', 'reduced-motion-forced');
    localStorage.removeItem('ccs-a11y-settings');
  });

  it('applies font size to root element', () => {
    vi.mocked(useAppStore).mockReturnValue({
      a11y: { fontSize: 20, highContrast: false, reducedMotion: false },
      setA11y: vi.fn(),
    });
    renderHook(() => useApplyAccessibility());
    expect(document.documentElement.style.fontSize).toBe('20px');
  });

  it('adds high-contrast class when enabled', () => {
    vi.mocked(useAppStore).mockReturnValue({
      a11y: { fontSize: 16, highContrast: true, reducedMotion: false },
      setA11y: vi.fn(),
    });
    renderHook(() => useApplyAccessibility());
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
  });

  it('adds reduced-motion-forced class when enabled', () => {
    vi.mocked(useAppStore).mockReturnValue({
      a11y: { fontSize: 16, highContrast: false, reducedMotion: true },
      setA11y: vi.fn(),
    });
    renderHook(() => useApplyAccessibility());
    expect(document.documentElement.classList.contains('reduced-motion-forced')).toBe(true);
  });

  it('removes high-contrast class when disabled', () => {
    document.documentElement.classList.add('high-contrast');
    vi.mocked(useAppStore).mockReturnValue({
      a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
      setA11y: vi.fn(),
    });
    renderHook(() => useApplyAccessibility());
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
  });
});
