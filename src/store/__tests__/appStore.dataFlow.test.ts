import { describe, it, expect } from 'vitest';
import { useAppStore } from '../appStore';
import { ProjectSchema } from '@/types/project';

describe('App Store - Data Flow Integration', () => {
  it('accepts validated projects via setProjects', () => {
    const validProject = ProjectSchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Valid Project',
      status: 'active',
      field: 'Biodiversity',
      description: 'A properly formatted description with sufficient length',
      location: 'Carpathians',
      yearRange: '2024-2028',
      lat: 47.5,
      lng: 25.0,
    });

    useAppStore.getState().setProjects([validProject]);

    const state = useAppStore.getState();
    expect(state.data.projects).toHaveLength(1);
    expect(state.data.projects[0].name).toBe('Valid Project');
  });

  it('addProject generates missing fields with defaults', () => {
    const partial = { name: 'New Project', field: 'Climate Change' };

    useAppStore.getState().addProject(partial);

    const state = useAppStore.getState();
    const added = state.data.projects[state.data.projects.length - 1];

    expect(added.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(added.status).toBe('planned');
    expect(added.lat).toBe(47.5);
    expect(added.lng).toBe(25.0);
    expect(added.yearRange).toMatch(/^\d{4}-\d{4}$/);
  });

  it('filters work correctly with loaded data', () => {
    const projects = [
      { id: '1', name: 'Active Bio', status: 'active', field: 'Biodiversity', description: 'Desc', location: 'Loc', yearRange: '2024-2028', lat: 1, lng: 1 },
      { id: '2', name: 'Past Hydro', status: 'past', field: 'Water', description: 'Desc', location: 'Loc', yearRange: '2020-2024', lat: 1, lng: 1 },
    ] as any;

    useAppStore.getState().setProjects(projects);
    useAppStore.getState().setStatusFilter('active');

    const filtered = useAppStore.getState().data.projects.filter(
      p => useAppStore.getState().filters.statusFilter === 'all' || p.status === useAppStore.getState().filters.statusFilter
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Active Bio');
  });
});
