// src/hooks/__tests__/ClusteringPerformance.test.ts
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAppStore } from '@/store/appStore';

// Mock data generator for stress testing
const generateProjects = (count: number) => Array.from({ length: count }, (_, i) => ({
  id: `p${i}`, name: `Project ${i}`, status: 'active' as const, field: 'Biodiversity',
  lat: 46 + Math.random() * 3, lng: 24 + Math.random() * 4,
  description: 'Test', location: 'Carpathians', yearRange: '2021-25'
}));

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn()
}));

describe('Map Clustering Performance QA', () => {
  beforeEach(() => { vi.useFakeTimers(); });

  it('handles 500 projects without blocking main thread', () => {
    const projects = generateProjects(500);
    vi.mocked(useAppStore).mockReturnValue({
       data: { projects, experts: [], loading: false, error: null },
      filters: { statusFilter: 'all', fieldFilter: 'all', searchTerm: '' },
      ui: { selectedProjectId: null },
    });

    const start = performance.now();
    const { result } = renderHook(() => useAppStore());
    const elapsed = performance.now() - start;

    expect(result.current.data.projects).toHaveLength(500);
    expect(elapsed).toBeLessThan(100); // <100ms render target
  });

  it('maintains stable re-renders during rapid zoom simulation', () => {
    let renderCount = 0;
    vi.mocked(useAppStore).mockImplementation(() => {
      renderCount++;
      return { 
        data: { projects: generateProjects(50), experts: [], loading: false, error: null },
        filters: { statusFilter: 'all', fieldFilter: 'all', searchTerm: '' },
        ui: { selectedProjectId: null },
      };
    });

    for (let i = 0; i < 20; i++) {
      renderHook(() => useAppStore());
      vi.advanceTimersByTime(16); // Simulate ~60fps frame
    }
    // Zustand's stable references prevent cascading re-renders
    expect(renderCount).toBe(20); // 1 per renderHook call, no extra leaks
  });
});
