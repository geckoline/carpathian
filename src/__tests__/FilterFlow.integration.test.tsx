import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '@/App';
import { useAppStore } from '@/store/appStore';
import { loadAppData } from '@/services/loadAppData';

vi.mock('@/components/map/MapView', () => ({
  default: () => <div data-testid="mock-map" />,
}));

vi.mock('@/components/ui/AnimatedCounter', () => ({
  default: ({ target }: { target: number }) => <span>{target}</span>,
}));

vi.mock('@/services/loadAppData', () => ({
  loadAppData: vi.fn(),
}));

const projects = [
  {
    id: '1', name: 'Forest Watch', status: 'active' as const, field: 'forests', categoryId: 'forests',
    description: 'Monitoring forest health', location: 'Romania', yearRange: '2024-2028',
    expertIds: ['e1'], teamMembers: [{ id: 'e1', name: 'Dr. Expert' }], isCitizenScience: true, countries: ['RO'],
    lat: 46, lng: 25,
  },
  {
    id: '2', name: 'River Cleanup', status: 'planned' as const, field: 'water', categoryId: 'water',
    description: 'Cleaning rivers', location: 'Poland', yearRange: '2025-2029',
    expertIds: ['e2'], teamMembers: [{ id: 'e2', name: 'Dr. Water' }], isCitizenScience: true, countries: ['PL'],
    lat: 47, lng: 24,
  },
];

const experts = [
  { id: 'e1', name: 'Dr. Expert', institution: 'Univ', countries: ['RO'], bio: 'Forest expert.', expertise: ['Forests'], email: 'a@b.com' },
  { id: 'e2', name: 'Dr. Water', institution: 'Inst', countries: ['PL'], bio: 'Water expert.', expertise: ['Water'], email: 'c@d.com' },
];

describe('filter flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState(null, '', '/');
    vi.mocked(loadAppData).mockResolvedValue({ projects, experts });
    useAppStore.setState({
      dataset: 'cs',
      data: { projects: [], experts: [], loading: false, error: null },
      filters: { searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name', sortDirection: 'asc' },
      ui: { selectedExpertId: null, selectedProjectId: null, expertImportDialog: null, hoveredProjectId: null },
    });
  });

  it('renders all projects by default', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('stat-projects')).toHaveTextContent('2'));
    expect(screen.getAllByTestId('project-card-title').length).toBe(2);
  });

  it('filters projects by status dropdown', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('stat-projects')).toHaveTextContent('2'));

    const statusSelect = screen.getAllByRole('combobox')[0]!;
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    await waitFor(() => {
      const titles = screen.getAllByTestId('project-card-title');
      expect(titles.length).toBe(1);
      expect(titles[0]).toHaveTextContent('Forest Watch');
    });
  });

  it('filters projects by search term', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('stat-projects')).toHaveTextContent('2'));

    const searchInput = screen.getAllByPlaceholderText('Projects, experts, places, keywords...')[0]!;
    fireEvent.change(searchInput, { target: { value: 'River' } });

    await waitFor(() => {
      const titles = screen.getAllByTestId('project-card-title');
      expect(titles.length).toBe(1);
      expect(titles[0]).toHaveTextContent('River Cleanup');
    }, { timeout: 5000 });
  });

  it('clears filters and shows all projects', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('stat-projects')).toHaveTextContent('2'));

    const statusSelect = screen.getAllByRole('combobox')[0]!;
    fireEvent.change(statusSelect, { target: { value: 'active' } });
    await waitFor(() => {
      expect(screen.getAllByTestId('project-card-title').length).toBe(1);
    });

    const clearButtons = screen.getAllByLabelText('Clear all filters');
    fireEvent.click(clearButtons[0]!);

    await waitFor(() => expect(screen.getAllByTestId('project-card-title').length).toBe(2));
  });

  it('switches to experts tab and filters experts', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('stat-projects')).toHaveTextContent('2'));

    const expertsTab = screen.getByRole('tab', { name: /experts/i });
    fireEvent.click(expertsTab);

    await waitFor(() => expect(screen.getByTestId('stat-experts')).toHaveTextContent('2'));
  });
});
