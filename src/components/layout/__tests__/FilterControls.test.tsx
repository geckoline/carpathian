import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilterControls } from '../FilterControls';

const mockSetSearchTerm = vi.fn();
const mockSetStatusFilter = vi.fn();
const mockSetFieldFilter = vi.fn();
const mockSetCountryFilter = vi.fn();
const mockClearFilters = vi.fn();

const baseStore = {
  dataset: 'cs',
  data: {
    projects: [
      { id: '1', name: 'Forest Watch', status: 'active', field: 'forests', countries: ['RO'], categoryId: 'forests', lat: 46, lng: 25 },
      { id: '2', name: 'River Clean', status: 'planned', field: 'water', countries: ['PL'], categoryId: 'water', lat: 47, lng: 24 },
    ],
    experts: [],
    loading: false,
    error: null,
  },
  filters: { searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name', sortDirection: 'asc' },
  a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
  ui: { selectedExpertId: null, selectedProjectId: null, hoveredProjectId: null, expertImportDialog: null },
  isOnline: true,
  setSearchTerm: mockSetSearchTerm,
  setStatusFilter: mockSetStatusFilter,
  setFieldFilter: mockSetFieldFilter,
  setCountryFilter: mockSetCountryFilter,
  clearFilters: mockClearFilters,
  setActiveTab: vi.fn(),
  setDataset: vi.fn(),
  setTheme: vi.fn(),
  setOnlineStatus: vi.fn(),
  setSelectedExpertId: vi.fn(),
  setSelectedProjectId: vi.fn(),
  setHoveredProjectId: vi.fn(),
  setDraftPolygon: vi.fn(),
  setExpertImportDialog: vi.fn(),
  setProjects: vi.fn(),
  setExperts: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
  addProject: vi.fn(),
  addExpert: vi.fn(),
  draftPolygon: null,
};

vi.mock('@/store/appStore', () => ({
  useAppStore: (selector: any) => selector ? selector(baseStore) : baseStore,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FilterControls', () => {
  it('renders search input', () => {
    render(<FilterControls idPrefix="test" />);
    expect(screen.getByPlaceholderText('Projects, experts, places, keywords...')).toBeInTheDocument();
  });

  it('renders status dropdown', () => {
    render(<FilterControls idPrefix="test" />);
    expect(screen.getByText('All status')).toBeInTheDocument();
  });

  it('renders category dropdown', () => {
    render(<FilterControls idPrefix="test" />);
    expect(screen.getByText('All categories')).toBeInTheDocument();
  });

  it('renders country dropdown', () => {
    render(<FilterControls idPrefix="test" />);
    expect(screen.getByText('All countries')).toBeInTheDocument();
  });

  it('clear button is disabled when no filters active', () => {
    render(<FilterControls idPrefix="test" />);
    expect(screen.getByLabelText('Clear all filters')).toBeDisabled();
  });

  it('renders with compact variant', () => {
    const { container } = render(<FilterControls idPrefix="test" variant="compact" />);
    expect(container.querySelector('[data-testid="test-controls"]')).toBeInTheDocument();
  });

  it('renders with custom projects prop', () => {
    render(<FilterControls idPrefix="test" projects={[]} />);
    expect(screen.getByPlaceholderText('Projects, experts, places, keywords...')).toBeInTheDocument();
  });
});
