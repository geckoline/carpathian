import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCardShare } from '../useCardShare';

const mockWriteText = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(navigator, {
    clipboard: { writeText: mockWriteText },
  });
});

describe('useCardShare', () => {
  it('generates share URL for project', () => {
    const { result } = renderHook(() => useCardShare({ kind: 'project', id: 'proj-1', dataset: 'cs' }));
    expect(result.current.shareUrl).toContain('card=project&id=proj-1');
  });

  it('generates share URL for expert', () => {
    const { result } = renderHook(() => useCardShare({ kind: 'expert', id: 'exp-1', dataset: 'cs' }));
    expect(result.current.shareUrl).toContain('card=expert&id=exp-1');
  });

  it('copies URL to clipboard', async () => {
    mockWriteText.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useCardShare({ kind: 'project', id: 'p1', dataset: 'cs' }));
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });
    await act(async () => { await result.current.copy(event as unknown as React.MouseEvent); });
    expect(mockWriteText).toHaveBeenCalledWith(result.current.shareUrl);
  });

  it('sets copied state after copy', async () => {
    mockWriteText.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useCardShare({ kind: 'project', id: 'p1', dataset: 'cs' }));
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });
    await act(async () => { await result.current.copy(event as unknown as React.MouseEvent); });
    expect(result.current.copied).toBe(true);
  });

  it('clears copied state after timeout', async () => {
    vi.useFakeTimers();
    mockWriteText.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useCardShare({ kind: 'project', id: 'p1', dataset: 'cs' }));
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });
    await act(async () => { await result.current.copy(event as unknown as React.MouseEvent); });
    expect(result.current.copied).toBe(true);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.copied).toBe(false);
    vi.useRealTimers();
  });

  it('handles clipboard API failure gracefully', async () => {
    mockWriteText.mockRejectedValueOnce(new Error('Clipboard error'));
    const { result } = renderHook(() => useCardShare({ kind: 'project', id: 'p1', dataset: 'cs' }));
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });
    await act(async () => { await result.current.copy(event as unknown as React.MouseEvent); });
    expect(mockWriteText).toHaveBeenCalled();
  });
});
