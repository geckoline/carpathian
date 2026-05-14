import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExpertFilters } from '../useExpertFilters';
import type { FilterState } from '@/store/appStore';

const mockExperts = [
  { id: '1', name: 'Dr. Elena Popescu', institution: 'Univ. of Bucharest', country: 'Romania', degree: 'PhD', bio: 'Leading research on biodiversity', expertise: ['Alpine Eco', 'Climate'] },
  { id: '2', name: 'Dr. Marek Kowalski', institution: 'Jagiellonian Univ.', country: 'Poland', degree: 'PhD', bio: 'Expert in pollinator ecology', expertise: ['Pollination Networks'] },
  { id: '3', name: 'Dr. Laura Munteanu', institution: 'Carpathian Wildlife Inst.', country: 'Romania', degree: 'PhD', bio: 'Studies wolf pack dynamics', expertise: ['Wildlife Tracking', 'GIS'] },
];

const defaultFilters: FilterState = {
  searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name', sortDirection: 'asc',
};

const storeState: {
  data: { experts: typeof mockExperts };
  filters: FilterState;
} = {
  data: { experts: mockExperts },
  filters: { ...defaultFilters },
};

vi.mock('@/store/appStore', () => ({
  useAppStore: (sel: any) => typeof sel === 'function' ? sel(storeState) : storeState,
}));

beforeEach(() => {
  storeState.filters = { ...defaultFilters };
});

describe('useExpertFilters', () => {
  it('returns all experts when no filters', () => {
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(3);
  });

  it('filters by expertise field', () => {
    storeState.filters.fieldFilter = 'alpine';
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(1);
    expect(result.current.filteredExperts[0].name).toBe('Dr. Elena Popescu');
  });

  it('filters by search term in name', () => {
    storeState.filters.searchTerm = 'marek';
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(1);
    expect(result.current.filteredExperts[0].name).toBe('Dr. Marek Kowalski');
  });

  it('filters by search term in institution', () => {
    storeState.filters.searchTerm = 'jagiellonian';
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(1);
  });

  it('filters by fuzzy search term with small typos', () => {
    storeState.filters.searchTerm = 'jagelonian';
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(1);
    expect(result.current.filteredExperts[0].name).toBe('Dr. Marek Kowalski');
  });

  it('combines field and search filters', () => {
    storeState.filters.fieldFilter = 'alpine';
    storeState.filters.searchTerm = 'elena';
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(1);
    expect(result.current.filteredExperts[0].name).toBe('Dr. Elena Popescu');
  });

  it('uses passed experts instead of store', () => {
    const externalExperts = [mockExperts[0]];
    const { result } = renderHook(() => useExpertFilters(externalExperts));
    expect(result.current.filteredExperts).toHaveLength(1);
    expect(result.current.filteredExperts[0].name).toBe('Dr. Elena Popescu');
  });

  it('filters by country', () => {
    storeState.filters.countryFilter = 'Romania';
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(2);
  });

  it('returns empty when no match', () => {
    storeState.filters.searchTerm = 'nonexistent';
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(0);
  });
});
