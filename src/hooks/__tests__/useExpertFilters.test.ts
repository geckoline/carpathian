import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExpertFilters } from '../useExpertFilters';

const createMockAppStore = vi.hoisted(() => (globalThis as any).__createMockAppStore);

const mockExperts = [
  { id: '1', name: 'Dr. Elena Popescu', institution: 'Univ. of Bucharest', countries: ['RO'], bio: 'Leading research on biodiversity', expertise: ['Alpine Eco', 'Climate'] },
  { id: '2', name: 'Dr. Marek Kowalski', institution: 'Jagiellonian Univ.', countries: ['PL'], bio: 'Expert in pollinator ecology', expertise: ['Pollination Networks'] },
  { id: '3', name: 'Dr. Laura Munteanu', institution: 'Carpathian Wildlife Inst.', countries: ['RO'], bio: 'Studies wolf pack dynamics', expertise: ['Wildlife Tracking', 'GIS'] },
];

const storeState: {
  data: { experts: typeof mockExperts };
  filters: { searchTerm: string; statusFilter: string; fieldFilter: string; countryFilter: string; activeTab: string; sortKey: string; sortDirection: string };
} = {
  data: { experts: mockExperts },
  filters: { searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name', sortDirection: 'asc' },
};

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn((sel?: any) => createMockAppStore({
    data: { experts: storeState.data.experts as any, loading: false, error: null },
    filters: storeState.filters as any,
  }).useAppStore(sel)),
}));

beforeEach(() => {
  storeState.filters = { searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name', sortDirection: 'asc' };
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
    expect(result.current.filteredExperts[0]!.name).toBe('Dr. Elena Popescu');
  });

  it('filters by search term in name', () => {
    storeState.filters.searchTerm = 'marek';
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(1);
    expect(result.current.filteredExperts[0]!.name).toBe('Dr. Marek Kowalski');
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
    expect(result.current.filteredExperts[0]!.name).toBe('Dr. Marek Kowalski');
  });

  it('combines field and search filters', () => {
    storeState.filters.fieldFilter = 'alpine';
    storeState.filters.searchTerm = 'elena';
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(1);
    expect(result.current.filteredExperts[0]!.name).toBe('Dr. Elena Popescu');
  });

  it('uses passed experts instead of store', () => {
    const externalExperts = [mockExperts[0]!];
    const { result } = renderHook(() => useExpertFilters(externalExperts));
    expect(result.current.filteredExperts).toHaveLength(1);
    expect(result.current.filteredExperts[0]!.name).toBe('Dr. Elena Popescu');
  });

  it('filters by country', () => {
    storeState.filters.countryFilter = 'RO';
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(2);
  });

  it('returns empty when no match', () => {
    storeState.filters.searchTerm = 'nonexistent';
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(0);
  });
});
