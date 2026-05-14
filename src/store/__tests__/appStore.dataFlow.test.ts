import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../appStore';
import { ProjectSchema } from '@/types/project';

beforeEach(() => {
  useAppStore.setState({
    dataset: 'cs',
    theme: 'light',
    filters: { searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name', sortDirection: 'asc' },
    data: { projects: [], experts: [], loading: false, error: null },
    ui: { isMapVisible: true, selectedExpertId: null, selectedProjectId: null, hoveredProjectId: null, isAddExpertOpen: false, expertImportDialog: null },
    draftPolygon: null,
    a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
    isOnline: true,
  });
});

describe('App Store', () => {
  it('accepts validated projects via setProjects', () => {
    const validProject = ProjectSchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Valid Project',
      status: 'active',
      field: 'Biodiversity',
      description: 'A properly formatted description with sufficient length',
      location: 'Carpathians',
      yearRange: '2024-2028',
      leadExpertId: '123e4567-e89b-12d3-a456-426614174001',
      leadExpertName: 'Dr. Elena Popescu',
      lat: 47.5,
      lng: 25.0,
    });

    useAppStore.getState().setProjects([validProject]);
    expect(useAppStore.getState().data.projects).toHaveLength(1);
    expect(useAppStore.getState().data.projects[0].name).toBe('Valid Project');
  });

  it('addProject generates missing fields with defaults', () => {
    useAppStore.getState().addProject({
      name: 'New Project',
      field: 'Climate Change',
      leadExpertId: '123e4567-e89b-12d3-a456-426614174001',
      leadExpertName: 'Dr. Elena Popescu',
    });

    const added = useAppStore.getState().data.projects[0];
    expect(added.id).toMatch(/^[0-9a-f-]+$/);
    expect(added.status).toBe('planned');
    expect(added.lat).toBe(47.5);
    expect(added.lng).toBe(25.0);
    expect(added.yearRange).toMatch(/^\d{4}-\d{4}$/);
  });

  it('addProject throws when leadExpertId is missing', () => {
    expect(() => useAppStore.getState().addProject({ name: 'Bad' })).toThrow('Every project must include a leading expert');
  });

  it('addExpert generates defaults for missing fields', () => {
    useAppStore.getState().addExpert({ id: 'exp-1', name: 'Dr. Test' });
    const added = useAppStore.getState().data.experts[0];
    expect(added.name).toBe('Dr. Test');
    expect(added.institution).toBe('Independent');
    expect(added.country).toBe('Unknown');
    expect(added.degree).toBe('Volunteer');
  });

  it('setDataset switches mode', () => {
    useAppStore.getState().setDataset('all');
    expect(useAppStore.getState().dataset).toBe('all');
    useAppStore.getState().setDataset('cs');
    expect(useAppStore.getState().dataset).toBe('cs');
  });

  it('setTheme switches theme', () => {
    useAppStore.getState().setTheme('dark');
    expect(useAppStore.getState().theme).toBe('dark');
  });

  it('setOnlineStatus updates connection state', () => {
    useAppStore.getState().setOnlineStatus(false);
    expect(useAppStore.getState().isOnline).toBe(false);
  });

  it('filter setters update individual filters', () => {
    useAppStore.getState().setSearchTerm('forest');
    expect(useAppStore.getState().filters.searchTerm).toBe('forest');

    useAppStore.getState().setStatusFilter('active');
    expect(useAppStore.getState().filters.statusFilter).toBe('active');

    useAppStore.getState().setFieldFilter('biodiversity');
    expect(useAppStore.getState().filters.fieldFilter).toBe('biodiversity');

    useAppStore.getState().setCountryFilter('Romania');
    expect(useAppStore.getState().filters.countryFilter).toBe('Romania');

    useAppStore.getState().setActiveTab('experts');
    expect(useAppStore.getState().filters.activeTab).toBe('experts');

    useAppStore.getState().setSortKey('yearRange');
    expect(useAppStore.getState().filters.sortKey).toBe('yearRange');

    useAppStore.getState().setSortDirection('desc');
    expect(useAppStore.getState().filters.sortDirection).toBe('desc');
  });

  it('clearFilters resets all filters to defaults', () => {
    useAppStore.getState().setSearchTerm('test');
    useAppStore.getState().setStatusFilter('past');
    useAppStore.getState().clearFilters();
    expect(useAppStore.getState().filters.searchTerm).toBe('');
    expect(useAppStore.getState().filters.statusFilter).toBe('all');
  });

  it('toggleMap flips visibility', () => {
    expect(useAppStore.getState().ui.isMapVisible).toBe(true);
    useAppStore.getState().toggleMap();
    expect(useAppStore.getState().ui.isMapVisible).toBe(false);
    useAppStore.getState().toggleMap();
    expect(useAppStore.getState().ui.isMapVisible).toBe(true);
  });

  it('sets selected project/expert IDs', () => {
    useAppStore.getState().setSelectedProjectId('proj-1');
    expect(useAppStore.getState().ui.selectedProjectId).toBe('proj-1');
    useAppStore.getState().setSelectedProjectId(null);
    expect(useAppStore.getState().ui.selectedProjectId).toBeNull();

    useAppStore.getState().setSelectedExpertId('exp-1');
    expect(useAppStore.getState().ui.selectedExpertId).toBe('exp-1');

    useAppStore.getState().setHoveredProjectId('proj-2');
    expect(useAppStore.getState().ui.hoveredProjectId).toBe('proj-2');
  });

  it('sets loading, error, and expert states', () => {
    useAppStore.getState().setLoading(true);
    expect(useAppStore.getState().data.loading).toBe(true);

    useAppStore.getState().setError('Connection failed');
    expect(useAppStore.getState().data.error).toBe('Connection failed');

    useAppStore.getState().setExperts([{ id: 'e1', name: 'Test', institution: 'U', country: 'C', bio: 'Bio', expertise: ['Eco'] } as any]);
    expect(useAppStore.getState().data.experts).toHaveLength(1);
  });

  it('setA11y applies partial accessibility updates', () => {
    useAppStore.getState().setA11y({ fontSize: 20, highContrast: true });
    expect(useAppStore.getState().a11y.fontSize).toBe(20);
    expect(useAppStore.getState().a11y.highContrast).toBe(true);
    expect(useAppStore.getState().a11y.reducedMotion).toBe(false);
  });

  it('setDraftPolygon stores polygon coordinates', () => {
    const coords: [number, number][] = [[47.5, 25.0], [48.0, 25.5], [47.0, 26.0]];
    useAppStore.getState().setDraftPolygon(coords);
    expect(useAppStore.getState().draftPolygon).toEqual(coords);
    useAppStore.getState().setDraftPolygon(null);
    expect(useAppStore.getState().draftPolygon).toBeNull();
  });

  it('setAddExpertOpen and setExpertImportDialog control UI state', () => {
    useAppStore.getState().setAddExpertOpen(true);
    expect(useAppStore.getState().ui.isAddExpertOpen).toBe(true);

    useAppStore.getState().setExpertImportDialog({ isOpen: true, importedData: null, existingData: null });
    expect(useAppStore.getState().ui.expertImportDialog).toEqual({ isOpen: true, importedData: null, existingData: null });

    useAppStore.getState().setExpertImportDialog(null);
    expect(useAppStore.getState().ui.expertImportDialog).toBeNull();
  });

  it('filters work correctly with loaded data', () => {
    const projects = [
      { id: '1', name: 'Active Bio', status: 'active', field: 'Biodiversity', description: 'Desc', location: 'Loc', yearRange: '2024-2028', lat: 1, lng: 1 },
      { id: '2', name: 'Past Hydro', status: 'past', field: 'Water', description: 'Desc', location: 'Loc', yearRange: '2020-2024', lat: 1, lng: 1 },
    ] as any;

    useAppStore.getState().setProjects(projects);
    useAppStore.getState().setStatusFilter('active');
    const filtered = useAppStore.getState().data.projects.filter(p => p.status === useAppStore.getState().filters.statusFilter);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Active Bio');
  });
});
