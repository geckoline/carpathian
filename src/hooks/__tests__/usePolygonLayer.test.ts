// src/hooks/__tests__/usePolygonLayer.test.ts
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePolygonLayer } from '../usePolygonLayer';
import { useAppStore } from '@/store/appStore';

vi.mock('@/store/appStore', () => ({ useAppStore: vi.fn() }));

describe('usePolygonLayer', () => {
  const mockProjects = [
    { id: 'p1', status: 'active', field: 'Biodiversity', lat: 47.5, lng: 25.0 },
    { id: 'p2', status: 'planned', field: 'Hydrology', lat: 49.0, lng: 20.0 },
  ];

  it('returns polygons for all projects when no filters active', () => {
    vi.mocked(useAppStore).mockReturnValue({ data: { projects: mockProjects as any }, filters: { statusFilter: 'all', fieldFilter: 'all' }, ui: { selectedProjectId: null } });
    const { result } = renderHook(() => usePolygonLayer());
    expect(result.current).toHaveLength(2);
  });

  it('filters polygons by status', () => {
    vi.mocked(useAppStore).mockReturnValue({ data: { projects: mockProjects as any }, filters: { statusFilter: 'active', fieldFilter: 'all' }, ui: { selectedProjectId: null } });
    const { result } = renderHook(() => usePolygonLayer());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].projectId).toBe('p1');
  });

  it('marks selected project polygon', () => {
    vi.mocked(useAppStore).mockReturnValue({ data: { projects: mockProjects as any }, filters: { statusFilter: 'all', fieldFilter: 'all' }, ui: { selectedProjectId: 'p2' } });
    const { result } = renderHook(() => usePolygonLayer());
    expect(result.current[0].isSelected).toBe(false);
    expect(result.current[1].isSelected).toBe(true);
  });
});
