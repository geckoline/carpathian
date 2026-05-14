import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const leadExpert = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Dr. CS Lead',
  institution: 'CS Institute',
  country: 'Romania',
  bio: 'Citizen science lead expert profile.',
  expertise: ['Citizen science'],
  email: 'lead@example.com',
};

const linkedExpert = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  name: 'Dr. Linked Contributor',
  institution: 'Linked Institute',
  country: 'Slovakia',
  bio: 'Linked citizen science contributor profile.',
  expertise: ['Hydrology'],
  email: 'linked@example.com',
};

const allOnlyExpert = {
  id: '123e4567-e89b-12d3-a456-426614174003',
  name: 'Dr. All Carpathian',
  institution: 'Regional Institute',
  country: 'Austria',
  bio: 'All-Carpathian project expert profile.',
  expertise: ['Climate policy'],
  email: 'all@example.com',
};

const projects = [
  {
    id: '123e4567-e89b-12d3-a456-426614174100',
    name: 'CS Pollinator Watch',
    status: 'active' as const,
    field: 'Biodiversity',
    description: 'A citizen science project visible in CS mode.',
    location: 'Romania',
    displayLocation: 'Romania',
    yearRange: '2024-2028',
    leadExpertId: leadExpert.id,
    leadExpertName: leadExpert.name,
    linkedExpertIds: [leadExpert.id, linkedExpert.id],
    lat: 47,
    lng: 25,
    country: 'Romania',
    isCitizenScience: true,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174101',
    name: 'Regional Climate Observatory',
    status: 'planned' as const,
    field: 'Climate Change',
    description: 'A non-CS database project visible only in All Carpathian mode.',
    location: 'Austria',
    displayLocation: 'Austria',
    yearRange: '2025-2029',
    leadExpertId: allOnlyExpert.id,
    leadExpertName: allOnlyExpert.name,
    linkedExpertIds: [allOnlyExpert.id],
    lat: 48,
    lng: 16,
    country: 'Austria',
    isCitizenScience: false,
  },
];

describe('dataset tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState(null, '', '/');
    vi.mocked(loadAppData).mockResolvedValue({
      projects,
      experts: [leadExpert, linkedExpert, allOnlyExpert],
    });
    useAppStore.setState({
      dataset: 'cs',
      data: { projects: [], experts: [], loading: false, error: null },
      filters: {
        searchTerm: '',
        statusFilter: 'all',
        fieldFilter: 'all',
        countryFilter: 'all',
        activeTab: 'projects',
        sortKey: 'name',
        sortDirection: 'asc',
      },
      ui: { isMapVisible: true, selectedExpertId: null, selectedProjectId: null, isAddExpertOpen: false, expertImportDialog: null, hoveredProjectId: null },
    });
  });

  it('switches the whole app from citizen-science projects to all database projects', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('stat-projects')).toHaveTextContent('1'));
    expect(screen.getAllByText('CS Pollinator Watch').length).toBeGreaterThan(0);
    expect(screen.queryByText('Regional Climate Observatory')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /all carpathian/i }));

    await waitFor(() => expect(screen.getByTestId('stat-projects')).toHaveTextContent('2'));
    expect(screen.getAllByText('Regional Climate Observatory').length).toBeGreaterThan(0);
  });

  it('shows all experts linked to CS projects in CS mode and all experts in All mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('stat-experts')).toHaveTextContent('2'));
    await user.click(screen.getByRole('button', { name: /experts/i }));

    expect(screen.getAllByText('Dr. CS Lead').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dr. Linked Contributor').length).toBeGreaterThan(0);
    expect(screen.queryByText('Dr. All Carpathian')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /all carpathian/i }));

    await waitFor(() => expect(screen.getByTestId('stat-experts')).toHaveTextContent('3'));
    expect(screen.getAllByText('Dr. All Carpathian').length).toBeGreaterThan(0);
  });
});
