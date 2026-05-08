import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePolygonDraw } from '../usePolygonDraw';

describe('usePolygonDraw', () => {
  it('initializes with empty state', () => {
    const { result } = renderHook(() => usePolygonDraw(null));
    expect(result.current.isDrawing).toBe(false);
    expect(result.current.coords).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('validates minimum 3 points for polygon', () => {
    const { result } = renderHook(() => usePolygonDraw(null));
    act(() => { result.current.addPoint(47, 25); });
    act(() => { result.current.addPoint(48, 26); });
    expect(result.current.error).toBe('Polygon requires at least 3 points');
  });

  it('rejects out-of-bounds coordinates', () => {
    const { result } = renderHook(() => usePolygonDraw(null));
    act(() => { result.current.addPoint(47, 25); });
    act(() => { result.current.addPoint(48, 26); });
    act(() => { result.current.addPoint(999, 999); });
    expect(result.current.error).toContain('Invalid coordinates');
  });

  it('completes drawing with valid coords', async () => {
    const { result } = renderHook(() => usePolygonDraw(null));
    act(() => { result.current.addPoint(47, 25); });
    act(() => { result.current.addPoint(48, 26); });
    act(() => { result.current.addPoint(47.5, 25.5); });
    await act(async () => {
      const success = await result.current.finishDrawing();
      expect(success).toBe(true);
    });
    expect(result.current.isDrawing).toBe(false);
    expect(result.current.coords).toHaveLength(3);
  });

  it('clears drawing state', () => {
    const { result } = renderHook(() => usePolygonDraw(null));
    act(() => { result.current.addPoint(47, 25); });
    act(() => { result.current.clearDrawing(); });
    expect(result.current.coords).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
