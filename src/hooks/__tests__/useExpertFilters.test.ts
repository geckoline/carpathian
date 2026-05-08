import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExpertFilters } from '../useExpertFilters';

const mockExperts = [
  { id: '1', name: 'Dr. Elena Popescu', institution: 'Univ. of Bucharest', country: 'Romania', degree: 'PhD', bio: 'Leading research on biodiversity', expertise: ['Alpine Eco', 'Climate'] },
  { id: '2', name: 'Dr. Marek Kowalski', institution: 'Jagiellonian Univ.', country: 'Poland', degree: 'PhD', bio: 'Expert in pollinator ecology', expertise: ['Pollination Networks'] },
  { id: '3', name: 'Dr. Laura Munteanu', institution: 'Carpathian Wildlife Inst.', country: 'Romania', degree: 'PhD', bio: 'Studies wolf pack dynamics', expertise: ['Wildlife Tracking', 'GIS'] },
];

const mockUseAppStore = vi.fn();

vi.mock('@/store/appStore', () => ({
  useAppStore: (sel: any) => mockUseAppStore(sel)
}));

beforeEach(() => {
  mockUseAppStore.mockReturnValue({
    data: { experts: mockExperts },
    filters: { fieldFilter: 'all', searchTerm: '' }
  });
});

describe('useExpertFilters', () => {
  it('returns all experts when no filters', () => {
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(3);
  });

  it('filters by expertise field', () => {
    mockUseAppStore.mockReturnValue({
      data: { experts: mockExperts },
      filters: { fieldFilter: 'alpine', searchTerm: '' }
    });
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(1);
    expect(result.current.filteredExperts[0].name).toBe('Dr. Elena Popescu');
  });

  it('filters by search term in name', () => {
    mockUseAppStore.mockReturnValue({
      data: { experts: mockExperts },
      filters: { fieldFilter: 'all', searchTerm: 'marek' }
    });
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(1);
    expect(result.current.filteredExperts[0].name).toBe('Dr. Marek Kowalski');
  });

  it('filters by search term in institution', () => {
    mockUseAppStore.mockReturnValue({
      data: { experts: mockExperts },
      filters: { fieldFilter: 'all', searchTerm: 'jagiellonian' }
    });
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(1);
  });

  it('combines field and search filters', () => {
    mockUseAppStore.mockReturnValue({
      data: { experts: mockExperts },
      filters: { fieldFilter: 'alpine', searchTerm: 'elena' }
    });
    const { result } = renderHook(() => useExpertFilters());
    expect(result.current.filteredExperts).toHaveLength(1);
    expect(result.current.filteredExperts[0].name).toBe('Dr. Elena Popescu');
  });
});
