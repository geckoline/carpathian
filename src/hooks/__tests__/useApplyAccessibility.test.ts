import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useApplyAccessibility } from '../useApplyAccessibility';
import { createMockAppStore } from '@/test-utils/mockStore';

let mockState: ReturnType<typeof createMockAppStore>;
vi.mock('@/store/appStore', () => ({
  useAppStore: (selector?: any) => selector ? selector(mockState) : mockState,
}));

vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(() => [null, vi.fn()]),
}));

describe('useApplyAccessibility', () => {
  beforeEach(() => {
    document.documentElement.style.fontSize = '';
    document.documentElement.classList.remove('high-contrast', 'reduced-motion-forced', 'theme-light', 'theme-dark', 'theme-reduced-color', 'dark');
    localStorage.removeItem('ccs-a11y-settings');
    mockState = createMockAppStore({}).useAppStore() as any;
  });

  it('applies font size to root element', () => {
    mockState = createMockAppStore({
      a11y: { fontSize: 20, highContrast: false, reducedMotion: false },
      theme: 'light',
    }).useAppStore() as any;
    renderHook(() => useApplyAccessibility());
    expect(document.documentElement.style.fontSize).toBe('20px');
  });

  it('adds high-contrast class when enabled', () => {
    mockState = createMockAppStore({
      a11y: { fontSize: 16, highContrast: true, reducedMotion: false },
      theme: 'light',
    }).useAppStore() as any;
    renderHook(() => useApplyAccessibility());
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
  });

  it('adds reduced-motion-forced class when enabled', () => {
    mockState = createMockAppStore({
      a11y: { fontSize: 16, highContrast: false, reducedMotion: true },
      theme: 'light',
    }).useAppStore() as any;
    renderHook(() => useApplyAccessibility());
    expect(document.documentElement.classList.contains('reduced-motion-forced')).toBe(true);
  });

  it('removes high-contrast class when disabled', () => {
    document.documentElement.classList.add('high-contrast');
    mockState = createMockAppStore({
      a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
      theme: 'light',
    }).useAppStore() as any;
    renderHook(() => useApplyAccessibility());
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
  });

  it('applies theme classes to the root element', () => {
    mockState = createMockAppStore({
      a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
      theme: 'dark',
    }).useAppStore() as any;
    renderHook(() => useApplyAccessibility());

    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
  });

  it('keeps font scaling, high contrast, reduced motion, and theme classes active together', () => {
    mockState = createMockAppStore({
      a11y: { fontSize: 22, highContrast: true, reducedMotion: true },
      theme: 'dark',
    }).useAppStore() as any;
    renderHook(() => useApplyAccessibility());

    expect(document.documentElement.style.fontSize).toBe('22px');
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    expect(document.documentElement.classList.contains('reduced-motion-forced')).toBe(true);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
