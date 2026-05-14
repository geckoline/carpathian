import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { useAppStore } from '@/store/appStore';
import { apiService } from '@/services/apiService';

vi.mock('@/components/map/MapView', () => ({
  default: () => <div data-testid="mock-map" />
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
  PROJECTS_CHANNEL: 'test:projects',
  EXPERTS_CHANNEL: 'test:experts',
}));

vi.mock('@/components/ui/AnimatedCounter', () => ({
  default: ({ target }: { target: number }) => <span>{target}</span>,
}));

vi.mock('@/services/apiService', () => ({
  apiService: {
    addProject: vi.fn().mockResolvedValue({ id: 'new-id' }),
    addExpert: vi.fn().mockResolvedValue({ id: 'new-expert-id' }),
    addVolunteerSubscription: vi.fn().mockResolvedValue({ id: 'new-subscription-id' }),
    getProjects: vi.fn().mockRejectedValue(new Error('No Supabase')),
    getExperts: vi.fn().mockRejectedValue(new Error('No Supabase')),
  },
}));

vi.mock('@/services/mockApi', () => ({
  mockApi: {
    getProjects: vi.fn().mockResolvedValue([]),
    getExperts: vi.fn().mockResolvedValue([{
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Dr. Demo Lead',
      institution: 'Demo Institute',
      country: 'Romania',
      degree: 'PhD',
      bio: 'A demo leading expert available for project creation tests.',
      expertise: ['Citizen science'],
      email: 'lead@example.com',
      linkedin: 'https://linkedin.com/in/demo-lead',
      isCitizenScience: true,
    }]),
    getProject: vi.fn().mockResolvedValue(null),
    getExpert: vi.fn().mockResolvedValue(null),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({
    dataset: 'cs',
    isOnline: true,
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
    ui: {
      isMapVisible: true,
      selectedExpertId: null,
      selectedProjectId: null,
      isAddExpertOpen: false,
      expertImportDialog: null,
      hoveredProjectId: null,
    },
  });
});

const fillProjectForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(await screen.findByLabelText(/project name/i, {}, { timeout: 5000 }), 'Demo Test Project');
  await user.type(screen.getByLabelText(/description/i), 'This is a test entry created in demo mode for testing purposes.');
  await user.type(screen.getByLabelText(/location/i), 'Virtual');
  await user.clear(screen.getByLabelText(/year range/i));
  await user.type(screen.getByLabelText(/year range/i), '2024-2025');
  await user.selectOptions(screen.getByTestId('add-project-field-input'), 'climate-change');
};

const fillVolunteerForm = async (user: ReturnType<typeof userEvent.setup>) => {
  const dialog = within(await screen.findByRole('dialog', {}, { timeout: 5000 }));
  await user.type(dialog.getByLabelText(/full name/i), 'Demo Volunteer');
  await user.type(dialog.getByLabelText(/email/i), 'volunteer@example.com');
  await user.type(dialog.getByLabelText(/city/i), 'Brasov');
  await user.type(dialog.getByLabelText(/country/i), 'Romania');
  await user.click(dialog.getByLabelText('Biodiversity'));
  await user.click(dialog.getByLabelText(/I consent/i));
};

describe('M4W1: Direct Demo Entry', () => {
  it('adds a project via modal and renders it immediately', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { name: /no projects found/i });

    await user.click(screen.getByRole('button', { name: /\+ add project/i }));
    await fillProjectForm(user);
    await user.click(screen.getByTestId('add-project-submit'));

    await waitFor(() => {
      expect(screen.getAllByText('Demo Test Project').length).toBeGreaterThan(0);
    });

    expect(await screen.findByText(/project added successfully/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows added project count in stats', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { name: /no projects found/i });

    await user.click(screen.getByRole('button', { name: /\+ add project/i }));
    await fillProjectForm(user);
    await user.click(screen.getByTestId('add-project-submit'));

    await waitFor(() => {
      const stat = screen.getByTestId('stat-projects');
      expect(stat.textContent).toBe('1');
    });
  });

  it('shows a useful empty project state with a clear next step', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: /no projects found/i })).toBeInTheDocument();
    expect(screen.getByText(/adjust your filters or add a project/i)).toBeInTheDocument();
  });

  it('shows a useful empty expert state after switching tabs', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /experts/i }));

    expect(await screen.findByRole('heading', { name: /no linked experts found/i })).toBeInTheDocument();
    expect(screen.getByText(/citizen science experts appear here when they are linked/i)).toBeInTheDocument();
  });

  it('keeps demo project entry working when Supabase write fails', async () => {
    vi.mocked(apiService.addProject).mockRejectedValueOnce(new Error('No Supabase'));

    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { name: /no projects found/i });

    await user.click(screen.getByRole('button', { name: /\+ add project/i }));
    await fillProjectForm(user);
    await user.click(screen.getByTestId('add-project-submit'));

    await waitFor(() => {
      expect(screen.getAllByText('Demo Test Project').length).toBeGreaterThan(0);
    });

    expect(await screen.findByText(/saved locally/i)).toBeInTheDocument();
  });

  it('shows volunteer success feedback', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { name: /no projects found/i });

    await user.click(screen.getByRole('button', { name: /volunteer alerts/i }));
    await fillVolunteerForm(user);
    await user.click(screen.getByRole('button', { name: /subscribe for alerts/i }));

    expect(await screen.findByText(/volunteer subscription saved/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows volunteer failure feedback and keeps modal open', async () => {
    vi.mocked(apiService.addVolunteerSubscription).mockRejectedValueOnce(new Error('No Supabase'));
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { name: /no projects found/i });

    await user.click(screen.getByRole('button', { name: /volunteer alerts/i }));
    await fillVolunteerForm(user);
    await user.click(screen.getByRole('button', { name: /subscribe for alerts/i }));

    expect(await screen.findByText(/could not be saved/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
