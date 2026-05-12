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
      countryFilter: 'all',
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
    leadExpertId: '123e4567-e89b-12d3-a456-426614174001',
    leadExpertName: 'Dr. Elena Popescu',
    lat: 47,
    lng: 25,
    country: 'Romania',
  },
  {
    id: 'p2',
    name: 'Forest Restore',
    status: 'planned' as const,
    field: 'Reforestation',
    description: 'Planting native trees',
    location: 'Poland',
    yearRange: '2024-2028',
    leadExpertId: '123e4567-e89b-12d3-a456-426614174002',
    leadExpertName: 'Dr. Marek Kowalski',
    lat: 49,
    lng: 20,
    country: 'Poland',
  },
  {
    id: 'p3',
    name: 'Pollinator Corridor Watch',
    status: 'active' as const,
    field: 'Biodiversity',
    description: 'Tracking pollinators across meadow corridors',
    location: 'Slovakia',
    yearRange: '2023-2027',
    leadExpertId: '123e4567-e89b-12d3-a456-426614174003',
    leadExpertName: 'Dr. Hana Novak',
    lat: 48,
    lng: 21,
    country: 'Slovakia',
  },
];

describe('useProjectFilters', () => {
  it('returns all projects when no filters active', () => {
    const { result } = renderHook(() => useProjectFilters(mockProjects));
    expect(result.current.filteredProjects).toHaveLength(3);
  });

  it('filters by search term (case-insensitive)', () => {
    vi.mocked(useAppStore).mockImplementation((selector) => selector({
      filters: { searchTerm: 'restore', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects' },
    } as any));
    
    const { result } = renderHook(() => useProjectFilters(mockProjects));
    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0].name).toBe('Forest Restore');
  });

  it('filters by fuzzy search term with small typos', () => {
    vi.mocked(useAppStore).mockImplementation((selector) => selector({
      filters: { searchTerm: 'polinator', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects' },
    } as any));

    const { result } = renderHook(() => useProjectFilters(mockProjects));
    expect(result.current.filteredProjects.map((project) => project.id)).toContain('p3');
  });

  it('filters by status', () => {
    vi.mocked(useAppStore).mockImplementation((selector) => selector({
      filters: { searchTerm: '', statusFilter: 'active', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects' },
    } as any));
    
    const { result } = renderHook(() => useProjectFilters(mockProjects));
    expect(result.current.filteredProjects).toHaveLength(2);
    expect(result.current.filteredProjects[0].status).toBe('active');
  });

  it('combines multiple filters with AND logic', () => {
    vi.mocked(useAppStore).mockImplementation((selector) => selector({
      filters: { 
        searchTerm: 'poland', 
        statusFilter: 'planned', 
        fieldFilter: 'all', 
        countryFilter: 'all',
        activeTab: 'projects',
      },
    } as any));
    
    const { result } = renderHook(() => useProjectFilters(mockProjects));
    expect(result.current.filteredProjects).toHaveLength(1);
    expect(result.current.filteredProjects[0].id).toBe('p2');
  });

  it('normalizes legacy category aliases before filtering', () => {
    vi.mocked(useAppStore).mockImplementation((selector) => selector({
      filters: { searchTerm: '', statusFilter: 'all', fieldFilter: 'wildlife', countryFilter: 'all', activeTab: 'projects' },
    } as any));

    const { result } = renderHook(() => useProjectFilters(mockProjects));
    expect(result.current.filteredProjects.map((project) => project.id)).toEqual(expect.arrayContaining(['p1', 'p3']));
  });
});
