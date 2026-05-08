import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectFilters } from '../useProjectFilters';
import { useAppStore } from '@/store/appStore';

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn((selector: (s: any) => any) => selector({
    filters: {
      searchTerm: '',
      statusFilter: 'all',
      fieldFilter: 'all',
      areaFilter: 'all',
      activeTab: 'projects',
    },
  })),
}));

const mockProjects = [
  {
    id: 'p1',
    name: 'Carpathian Watch',
    status: 'active' as const,
    field: 'Biodiversity',
    description: 'Monitoring deforestation',
    location: 'Romania',
    yearRange: '2021-2025',
    lat: 47,
    lng: 25,
  },
  {
    id: 'p2',
    name: 'Forest Restore',
    status: 'planned' as const,
    field: 'Reforestation',
    description: 'Planting native trees',
    location: 'Poland',
    yearRange: '2024-2028',
    lat: 49,
    lng: 20,
    area: 'poland',
  },
];

describe('useProjectFilters', () => {
  it('returns all projects when no filters active', () => {
    const { result } = renderHook(() => useProjectFilters(mockProjects));
    expect(result.current.filteredProjects).toHaveLength(2);
  });

  it('filters by search term (case-insensitive)', () => {
    vi.mocked(useAppStore).mockImplementation((selector) => selector({
      filters: { searchTerm: 'restore', statusFilter: 'all', fieldFilter: 'all', areaFilter: 'all', activeTab: 'projects' },
    } as any));
    
    const { result } = renderHook(() => useProjectFilters(mockProjects));
    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0].name).toBe('Forest Restore');
  });

  it('filters by status', () => {
    vi.mocked(useAppStore).mockImplementation((selector) => selector({
      filters: { searchTerm: '', statusFilter: 'active', fieldFilter: 'all', areaFilter: 'all', activeTab: 'projects' },
    } as any));
    
    const { result } = renderHook(() => useProjectFilters(mockProjects));
    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0].status).toBe('active');
  });

  it('combines multiple filters with AND logic', () => {
    vi.mocked(useAppStore).mockImplementation((selector) => selector({
      filters: { 
        searchTerm: 'poland', 
        statusFilter: 'planned', 
        fieldFilter: 'all', 
        areaFilter: 'all',
        activeTab: 'projects',
      },
    } as any));
    
    const { result } = renderHook(() => useProjectFilters(mockProjects));
    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0].id).toBe('p2');
  });
});
