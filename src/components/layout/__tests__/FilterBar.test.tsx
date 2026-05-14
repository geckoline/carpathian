import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from '../FilterBar';
import { useAppStore, AppState } from '@/store/appStore';

const createMockStore = (overrides: Partial<AppState> = {}) => {
  const base: AppState = {
    dataset: 'cs',
    theme: 'light',
    isOnline: true,
    filters: { searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name' as const, sortDirection: 'asc' as const },
    ui: { isMapVisible: true, selectedExpertId: null, selectedProjectId: null, hoveredProjectId: null },
    data: { projects: [], experts: [], loading: false, error: null },
    a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
    draftPolygon: null,
    setDataset: vi.fn(),
    setTheme: vi.fn(),
    setOnlineStatus: vi.fn(),
    setSearchTerm: vi.fn(),
    setStatusFilter: vi.fn(),
    setFieldFilter: vi.fn(),
    setCountryFilter: vi.fn(),
    setActiveTab: vi.fn(),
    setSortKey: vi.fn(),
    setSortDirection: vi.fn(),
    clearFilters: vi.fn(),
    toggleMap: vi.fn(),
    setSelectedExpertId: vi.fn(),
    setSelectedProjectId: vi.fn(),
    setProjects: vi.fn(),
    setExperts: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
    setA11y: vi.fn(),
    addProject: vi.fn(),
    addExpert: vi.fn(),
    setHoveredProjectId: vi.fn(),
    setDraftPolygon: vi.fn(),
  };
  return { ...base, ...overrides };
};

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn((sel?: (s: AppState) => unknown) => {
    const store = createMockStore();
    return sel ? sel(store) : store;
  })
}));

describe('FilterBar', () => {
  it('renders search input with local state', () => {
    render(<FilterBar />);
    expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByTestId('main-filters-controls')).toHaveClass('grid-cols-2', 'md:grid-cols-[minmax(220px,1fr)_150px_220px_180px_auto]');
    expect(screen.getByTestId('main-filters-search-field')).toHaveClass('col-span-2', 'md:col-span-1');
  });

  it('debounces search input to store', async () => {
    const setSearchTerm = vi.fn();
    vi.mocked(useAppStore).mockImplementation((sel?: (s: AppState) => unknown) => {
      const store = createMockStore({ setSearchTerm });
      return sel ? sel(store) : store;
    });

    render(<FilterBar />);
    const input = screen.getByRole('textbox', { name: /search/i });
    await userEvent.type(input, 'hi');
    expect(setSearchTerm).not.toHaveBeenCalled();
  });

  it('calls status filter on select change', async () => {
    const setStatusFilter = vi.fn();
    vi.mocked(useAppStore).mockImplementation((sel?: (s: AppState) => unknown) => {
      const store = createMockStore({
        setStatusFilter,
        data: {
          projects: [
            { id: 'p1', name: 'P1', status: 'active', field: 'Water', description: 'Project description here', location: 'Romania', yearRange: '2024-2028', leadExpertId: '123e4567-e89b-12d3-a456-426614174001', leadExpertName: 'Dr. Elena Popescu', lat: 47, lng: 25, country: 'Romania' },
          ],
          experts: [],
          loading: false,
          error: null,
        },
      });
      return sel ? sel(store) : store;
    });

    render(<FilterBar />);
    const select = screen.getByRole('combobox', { name: /status/i });
    await userEvent.selectOptions(select, 'active');
    expect(setStatusFilter).toHaveBeenCalledWith('active');
  });

  it('uses canonical categories and available countries as linked filter options', async () => {
    const setFieldFilter = vi.fn();
    const setCountryFilter = vi.fn();
    vi.mocked(useAppStore).mockImplementation((sel?: (s: AppState) => unknown) => {
      const store = createMockStore({
        setFieldFilter,
        setCountryFilter,
        data: {
          projects: [
            { id: 'p1', name: 'P1', status: 'active', field: 'Water', description: 'Project description here', location: 'Romania', yearRange: '2024-2028', leadExpertId: '123e4567-e89b-12d3-a456-426614174001', leadExpertName: 'Dr. Elena Popescu', lat: 47, lng: 25, country: 'Romania' },
            { id: 'p2', name: 'P2', status: 'planned', field: 'Forests', description: 'Project description here', location: 'Poland', yearRange: '2024-2028', leadExpertId: '123e4567-e89b-12d3-a456-426614174002', leadExpertName: 'Dr. Marek Kowalski', lat: 49, lng: 20, country: 'Poland' },
          ],
          experts: [],
          loading: false,
          error: null,
        },
      });
      return sel ? sel(store) : store;
    });

    render(<FilterBar />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /category/i }), 'water');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /country/i }), 'Romania');

    expect(screen.getByRole('option', { name: 'Water' })).toBeInTheDocument();
    expect(setFieldFilter).toHaveBeenCalledWith('water');
    expect(setCountryFilter).toHaveBeenCalledWith('Romania');
  });

  it('limits categories by selected status and countries by selected category', () => {
    vi.mocked(useAppStore).mockImplementation((sel?: (s: AppState) => unknown) => {
      const store = createMockStore({
        filters: { searchTerm: '', statusFilter: 'active', fieldFilter: 'water', countryFilter: 'all', activeTab: 'projects', sortKey: 'name' as const, sortDirection: 'asc' as const },
        data: {
          projects: [
            { id: 'p1', name: 'P1', status: 'active', field: 'Water', description: 'Project description here', location: 'Romania', yearRange: '2024-2028', leadExpertId: '123e4567-e89b-12d3-a456-426614174001', leadExpertName: 'Dr. Elena Popescu', lat: 47, lng: 25, country: 'Romania' },
            { id: 'p2', name: 'P2', status: 'planned', field: 'Forests', description: 'Project description here', location: 'Poland', yearRange: '2024-2028', leadExpertId: '123e4567-e89b-12d3-a456-426614174002', leadExpertName: 'Dr. Marek Kowalski', lat: 49, lng: 20, country: 'Poland' },
            { id: 'p3', name: 'P3', status: 'active', field: 'Tourism', description: 'Project description here', location: 'Slovakia', yearRange: '2024-2028', leadExpertId: '123e4567-e89b-12d3-a456-426614174003', leadExpertName: 'Dr. Hana Novak', lat: 48, lng: 21, country: 'Slovakia' },
          ],
          experts: [],
          loading: false,
          error: null,
        },
      });
      return sel ? sel(store) : store;
    });

    render(<FilterBar />);

    expect(screen.getByRole('option', { name: 'Water' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Tourism' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Forests' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Romania' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Slovakia' })).not.toBeInTheDocument();
  });

  it('shows clear button when filters are active', async () => {
    const clearFilters = vi.fn();
    vi.mocked(useAppStore).mockImplementation((sel?: (s: AppState) => unknown) => {
      const store = createMockStore({ clearFilters, filters: { searchTerm: 'test', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name' as const, sortDirection: 'asc' as const } });
      return sel ? sel(store) : store;
    });

    render(<FilterBar />);
    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /clear all filters/i }));
    expect(clearFilters).toHaveBeenCalled();
  });

  it('disables clear button when no filters are active', () => {
    vi.mocked(useAppStore).mockImplementation((sel?: (s: AppState) => unknown) => {
      const store = createMockStore();
      return sel ? sel(store) : store;
    });

    render(<FilterBar />);
    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeDisabled();
  });
});
