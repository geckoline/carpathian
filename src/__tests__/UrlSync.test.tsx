import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

describe('useUrlSync', () => {
  let scrollSpy: any;

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
    Element.prototype.scrollIntoView = () => {};
    scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    scrollSpy?.mockRestore();
  });

  it('scrolls to card and adds pulse class for 3s', async () => {
    document.body.innerHTML = '<div id="project-card-test-123">Test</div>';

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { search: '?id=test-123', pathname: '/' },
      writable: true,
    });

    await act(async () => {
      const { useUrlSync } = await import('@/hooks/useUrlSync');
      const TestComponent = () => { useUrlSync(); return null; };
      render(<TestComponent />);
    });

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });

    const el = document.getElementById('project-card-test-123');
    expect(el?.classList.contains('animate-pulse-ring')).toBe(true);

    act(() => { vi.advanceTimersByTime(3000); });

    expect(el?.classList.contains('animate-pulse-ring')).toBe(false);

    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });
});
