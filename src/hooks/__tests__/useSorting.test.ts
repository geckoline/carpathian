import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSorting } from '../useSorting';
import { ProjectData } from '@/types/project';

const makeProject = (overrides: Partial<ProjectData>): ProjectData => ({
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Test',
  status: 'active',
  field: 'Biodiversity',
  description: 'A test project with enough description text',
  location: 'Test Location',
  yearRange: '2023-2025',
  leadExpertId: '123e4567-e89b-12d3-a456-426614174001',
  leadExpertName: 'Dr. Elena Popescu',
  lat: 45,
  lng: 25,
  ...overrides,
});

describe('useSorting', () => {
  it('returns projects sorted by name ascending by default', () => {
    const projects = [
      makeProject({ name: 'Zebra', id: '00000000-0000-0000-0000-000000000001' }),
      makeProject({ name: 'Alpha', id: '00000000-0000-0000-0000-000000000002' }),
      makeProject({ name: 'Mango', id: '00000000-0000-0000-0000-000000000003' }),
    ];
    const { result } = renderHook(() => useSorting(projects));
    expect(result.current.sortedProjects.map((p) => p.name)).toEqual(['Alpha', 'Mango', 'Zebra']);
  });

  it('sorts descending when toggleSort is called once on default key', () => {
    const projects = [
      makeProject({ name: 'Alpha', id: '00000000-0000-0000-0000-000000000001' }),
      makeProject({ name: 'Zebra', id: '00000000-0000-0000-0000-000000000002' }),
    ];
    const { result } = renderHook(() => useSorting(projects));
    act(() => result.current.toggleSort('name'));
    expect(result.current.sortDirection).toBe('desc');
    expect(result.current.sortedProjects.map((p) => p.name)).toEqual(['Zebra', 'Alpha']);
  });

  it('cycles back to asc when toggleSort is called twice on same key', () => {
    const projects = [
      makeProject({ name: 'Alpha', id: '00000000-0000-0000-0000-000000000001' }),
      makeProject({ name: 'Zebra', id: '00000000-0000-0000-0000-000000000002' }),
    ];
    const { result } = renderHook(() => useSorting(projects));
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('name'));
    expect(result.current.sortDirection).toBe('asc');
  });

  it('resets to ascending when toggling to a new key', () => {
    const projects = [
      makeProject({ name: 'B', status: 'past', field: 'Wildlife', id: '00000000-0000-0000-0000-000000000001' }),
      makeProject({ name: 'A', status: 'active', field: 'Biodiversity', id: '00000000-0000-0000-0000-000000000002' }),
    ];
    const { result } = renderHook(() => useSorting(projects));
    act(() => result.current.toggleSort('status'));
    expect(result.current.sortDirection).toBe('asc');
    expect(result.current.sortKey).toBe('status');
  });

  it('sorts by yearRange correctly', () => {
    const projects = [
      makeProject({ yearRange: '2024-2026', id: '00000000-0000-0000-0000-000000000001' }),
      makeProject({ yearRange: '2020-2022', id: '00000000-0000-0000-0000-000000000002' }),
    ];
    const { result } = renderHook(() => useSorting(projects));
    act(() => result.current.toggleSort('yearRange'));
    expect(result.current.sortedProjects.map((p) => p.yearRange)).toEqual(['2020-2022', '2024-2026']);
  });

  it('does not mutate original array', () => {
    const projects = [
      makeProject({ name: 'Zebra', id: '00000000-0000-0000-0000-000000000001' }),
      makeProject({ name: 'Alpha', id: '00000000-0000-0000-0000-000000000002' }),
    ];
    const originalOrder = [...projects];
    renderHook(() => useSorting(projects));
    expect(projects).toEqual(originalOrder);
  });

  it('exposes setSortKey and setSortDirection directly', () => {
    const projects = [
      makeProject({ name: 'B', id: '00000000-0000-0000-0000-000000000001' }),
      makeProject({ name: 'A', id: '00000000-0000-0000-0000-000000000002' }),
    ];
    const { result } = renderHook(() => useSorting(projects));
    act(() => result.current.setSortKey('field'));
    act(() => result.current.setSortDirection('desc'));
    expect(result.current.sortKey).toBe('field');
    expect(result.current.sortDirection).toBe('desc');
  });
});
