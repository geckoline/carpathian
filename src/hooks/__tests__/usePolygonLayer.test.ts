import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePolygonLayer } from '../usePolygonLayer';

const mockProjects = [
  { id: 'p1', status: 'active', field: 'Biodiversity', lat: 47.5, lng: 25.0, location: "geometry('POLYGON((24.7 47.3, 25.2 47.3, 25.4 47.5, 25.3 47.7, 24.9 47.8, 24.6 47.6, 24.6 47.4, 24.7 47.3))', 4326)" },
  { id: 'p2', status: 'planned', field: 'Water', lat: 49.0, lng: 20.0, location: "geometry('POLYGON((19.7 48.8, 20.0 48.8, 20.3 48.9, 20.4 49.0, 20.3 49.2, 20.0 49.3, 19.7 49.2, 19.6 49.0, 19.7 48.8))', 4326)" },
];

const storeState: {
  data: { projects: typeof mockProjects };
  ui: { selectedProjectId: string | null };
} = {
  data: { projects: mockProjects },
  ui: { selectedProjectId: null },
};

vi.mock('@/store/appStore', () => ({
  useAppStore: (sel: any) => typeof sel === 'function' ? sel(storeState) : storeState,
}));

beforeEach(() => {
  storeState.ui.selectedProjectId = null;
});

describe('usePolygonLayer', () => {
  it('returns empty array when no project is selected', () => {
    const { result } = renderHook(() => usePolygonLayer());
    expect(result.current).toHaveLength(0);
  });

  it('does not filter by status or field anymore — only selectedProjectId matters', () => {
    storeState.ui.selectedProjectId = 'p2';
    const { result } = renderHook(() => usePolygonLayer());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].projectId).toBe('p2');
  });

  it('returns polygon for the selected project', () => {
    storeState.ui.selectedProjectId = 'p1';
    const { result } = renderHook(() => usePolygonLayer());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].projectId).toBe('p1');
    expect(result.current[0].isSelected).toBe(true);
  });

  it('uses provided projects array instead of store projects', () => {
    storeState.ui.selectedProjectId = 'p2';
    storeState.data.projects = [];
    const { result } = renderHook(() => usePolygonLayer([mockProjects[1] as any]));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].projectId).toBe('p2');
  });

  it('returns empty array when selected project is not in the projects list', () => {
    storeState.ui.selectedProjectId = 'nonexistent';
    const { result } = renderHook(() => usePolygonLayer());
    expect(result.current).toHaveLength(0);
  });
});
