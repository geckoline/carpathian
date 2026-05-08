import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from '@/store/appStore';
import { renderHook, act } from '@testing-library/react';

vi.mock('react-leaflet', () => ({
  useMap: () => ({ on: vi.fn(), off: vi.fn(), addLayer: vi.fn() }),
}));

describe('Polygon Store Sync', () => {
  beforeEach(() => { useAppStore.setState({ draftPolygon: null }); });

  it('syncs drawn polygon to draftPolygon store state', () => {
    const { result } = renderHook(() => useAppStore());
    const testCoords: [number, number][] = [[47.5, 25.0], [47.6, 25.1], [47.55, 25.2]];

    act(() => { useAppStore.getState().setDraftPolygon(testCoords); });

    expect(result.current.draftPolygon).toEqual(testCoords);
    expect(result.current.draftPolygon).toHaveLength(3);
  });
});
