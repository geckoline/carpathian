import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { useAppStore } from '@/store/appStore';

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
    getProjects: vi.fn().mockRejectedValue(new Error('No Supabase')),
    getExperts: vi.fn().mockRejectedValue(new Error('No Supabase')),
  },
}));

vi.mock('@/services/mockApi', () => ({
  mockApi: {
    getProjects: vi.fn().mockResolvedValue([]),
    getExperts: vi.fn().mockResolvedValue([]),
    getProject: vi.fn().mockResolvedValue(null),
    getExpert: vi.fn().mockResolvedValue(null),
  },
}));

beforeEach(() => {
  useAppStore.setState({ data: { projects: [], experts: [], loading: false, error: null } });
});

const fillProjectForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/project name/i), 'Demo Test Project');
  await user.type(screen.getByLabelText(/description/i), 'This is a test entry created in demo mode for testing purposes.');
  await user.type(screen.getByLabelText(/location/i), 'Virtual');
  await user.clear(screen.getByLabelText(/year range/i));
  await user.type(screen.getByLabelText(/year range/i), '2024-2025');
  await user.type(screen.getByTestId('add-project-field-input'), 'Climate');
};

describe('M4W1: Direct Demo Entry', () => {
  it('adds a project via modal and renders it immediately', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/no results match/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /\+ add project/i }));
    await fillProjectForm(user);
    await user.click(screen.getByTestId('add-project-submit'));

    await waitFor(() => {
      expect(screen.getAllByText('Demo Test Project').length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows added project count in stats', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/no results match/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /\+ add project/i }));
    await fillProjectForm(user);
    await user.click(screen.getByTestId('add-project-submit'));

    await waitFor(() => {
      const stat = screen.getByTestId('stat-projects');
      expect(stat.textContent).toBe('1');
    });
  });
});
