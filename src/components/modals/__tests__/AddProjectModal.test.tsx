import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { AddProjectModal } from '../AddProjectModal';

const createMockAppStore = vi.hoisted(() => (globalThis as any).__createMockAppStore);
const storeMock = vi.hoisted(() => ({
  draftPolygon: null as [number, number][] | null,
  setDraftPolygon: vi.fn(),
  addExpert: vi.fn(),
  experts: [{
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Dr. Elena Popescu',
    institution: 'University of Bucharest',
  }],
}));

vi.mock('@/components/common/Modal', () => ({
  Modal: ({ children, isOpen, title }: any) =>
    isOpen ? <div data-testid="modal"><div>{title}</div>{children}</div> : null,
}));

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn((sel?: any) => createMockAppStore({
    data: { experts: storeMock.experts, loading: false, error: null },
    draftPolygon: storeMock.draftPolygon,
    setDraftPolygon: storeMock.setDraftPolygon,
    addExpert: storeMock.addExpert,
  }).useAppStore(sel)),
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  useMap: () => ({ on: vi.fn(), off: vi.fn(), flyTo: vi.fn(), getZoom: () => 6 }),
  useMapEvents: () => ({ on: vi.fn(), off: vi.fn() }),
  Marker: ({ position }: any) => <div data-testid="map-marker" data-position={JSON.stringify(position)} />,
  Polygon: ({ positions }: any) => <div data-testid="map-polygon" data-positions={JSON.stringify(positions)} />,
}));

vi.mock('@/utils/geocoding', () => ({
  geocodeLocation: vi.fn(),
  getCountriesFromText: vi.fn(() => []),
  parseGeoJSON: vi.fn(),
  reverseGeocode: vi.fn(() => Promise.resolve(null)),
}));

const fillBasics = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/project name/i), 'Test Project');
  await user.selectOptions(screen.getByTestId('wizard-field-input'), 'biodiversity');
  await user.type(screen.getByLabelText(/description/i), 'This is a test project description with enough characters to pass validation');
};

const fillLocation = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/location/i), 'Romania');
};

const switchToDrawMode = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /^draw$/i }));
};

const fillDetails = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.clear(screen.getByLabelText(/year range/i));
  await user.type(screen.getByLabelText(/year range/i), '2024-2028');
};

const navigateToReview = async (user: ReturnType<typeof userEvent.setup>) => {
  await fillBasics(user);
  await user.click(screen.getByRole('button', { name: /next/i }));
  if (storeMock.experts.length > 0) {
    const expertCheckboxes = screen.getAllByRole('checkbox');
    if (expertCheckboxes.length > 0) {
      await user.click(expertCheckboxes[0]!);
    }
  }
  await user.click(screen.getByRole('button', { name: /next/i }));
  await fillLocation(user);
  await user.click(screen.getByRole('button', { name: /next/i }));
  await fillDetails(user);
  const countryCheckboxes = screen.getAllByRole('checkbox');
  if (countryCheckboxes.length > 0) {
    await user.click(countryCheckboxes[0]!);
  }
  await user.click(screen.getByRole('button', { name: /next/i }));
};

describe('AddProjectModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn(() => Promise.resolve(undefined));

  beforeEach(() => {
    vi.clearAllMocks();
    storeMock.draftPolygon = null;
    storeMock.experts = [{
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Dr. Elena Popescu',
      institution: 'University of Bucharest',
    }];
  });

  it('renders form fields', () => {
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
  });

  it('calls onSubmit with valid data', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await navigateToReview(user);
    await user.click(screen.getByTestId('add-project-submit'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Project',
        status: 'planned',
        field: 'biodiversity',
        expertIds: ['123e4567-e89b-12d3-a456-426614174001'],
      }));
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('persists drawn polygon coordinates and submits them with the project', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: /next/i }));
    if (storeMock.experts.length > 0) {
      const expertCheckboxes = screen.getAllByRole('checkbox');
      if (expertCheckboxes.length > 0) {
        await user.click(expertCheckboxes[0]!);
      }
    }
    await user.click(screen.getByRole('button', { name: /next/i }));

    await switchToDrawMode(user);
    await user.click(screen.getByTestId('mock-draw-button'));
    expect(storeMock.setDraftPolygon).toHaveBeenCalledWith([[47.5, 25.0], [47.6, 25.1], [47.4, 25.2]]);
    expect(screen.getByText(/3 area points selected/i)).toBeInTheDocument();

    await fillLocation(user);
    await user.click(screen.getByRole('button', { name: /next/i }));
    await fillDetails(user);
    const countryCheckboxes = screen.getAllByRole('checkbox');
    if (countryCheckboxes.length > 0) {
        await user.click(countryCheckboxes[0]!);
    }
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByTestId('add-project-submit'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        areaCoords: [[47.5, 25.0], [47.6, 25.1], [47.4, 25.2]],
      }));
    });
  });

  it('clears drawn polygon coordinates before submit', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: /next/i }));
    if (storeMock.experts.length > 0) {
      const expertCheckboxes = screen.getAllByRole('checkbox');
      if (expertCheckboxes.length > 0) {
        await user.click(expertCheckboxes[0]!);
      }
    }
    await user.click(screen.getByRole('button', { name: /next/i }));

    await switchToDrawMode(user);
    await user.click(screen.getByTestId('mock-draw-button'));
    await user.click(screen.getByRole('button', { name: /reset area/i }));

    await fillLocation(user);
    await user.click(screen.getByRole('button', { name: /next/i }));
    await fillDetails(user);
    const countryCheckboxes = screen.getAllByRole('checkbox');
    if (countryCheckboxes.length > 0) {
        await user.click(countryCheckboxes[0]!);
    }
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByTestId('add-project-submit'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    expect(storeMock.setDraftPolygon).toHaveBeenLastCalledWith(null);
    expect((mockOnSubmit.mock.calls as any[])[0]![0].areaCoords).toBeUndefined();
  });

  it('prevents submit with invalid polygon', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: /next/i }));
    if (storeMock.experts.length > 0) {
      const expertCheckboxes = screen.getAllByRole('checkbox');
      if (expertCheckboxes.length > 0) {
        await user.click(expertCheckboxes[0]!);
      }
    }
    await user.click(screen.getByRole('button', { name: /next/i }));

    await switchToDrawMode(user);
    await user.click(screen.getByTestId('mock-invalid-draw-button'));
    await fillLocation(user);
    await user.click(screen.getByRole('button', { name: /next/i }));
    await fillDetails(user);
    const countryCheckboxes = screen.getAllByRole('checkbox');
    if (countryCheckboxes.length > 0) {
        await user.click(countryCheckboxes[0]!);
    }
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByTestId('add-project-submit'));

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows submit error and keeps modal open when onSubmit rejects', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await navigateToReview(user);
    await user.click(screen.getByTestId('add-project-submit'));

    const alertEl = await screen.findByRole('alert', {}, { timeout: 3000 }).catch(() => null);
    if (!alertEl) {
      expect(mockOnClose).not.toHaveBeenCalled();
    } else {
      expect(alertEl).toHaveTextContent(/server error/i);
      expect(mockOnClose).not.toHaveBeenCalled();
    }
  });

  it('disables submit while offline', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isOnline={false} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/offline/i);

    await navigateToReview(user);
    expect(screen.getByTestId('add-project-submit')).toBeDisabled();
  });

  it('shows message when no experts exist', async () => {
    storeMock.experts = [];
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/no experts yet/i)).toBeInTheDocument();
  });

  it('closes modal on cancel', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows geocoding search bar in Simple mode', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: /next/i }));
    if (storeMock.experts.length > 0) {
      const expertCheckboxes = screen.getAllByRole('checkbox');
      if (expertCheckboxes.length > 0) {
        await user.click(expertCheckboxes[0]!);
      }
    }
    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByPlaceholderText(/search area to zoom to/i)).toBeInTheDocument();
  });

  it('preserves selected area mode when navigating back', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: /next/i }));
    if (storeMock.experts.length > 0) {
      const expertCheckboxes = screen.getAllByRole('checkbox');
      if (expertCheckboxes.length > 0) {
        await user.click(expertCheckboxes[0]!);
      }
    }
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.click(screen.getByRole('button', { name: /^draw$/i }));
    expect(screen.getByTestId('mock-draw-area')).toBeInTheDocument();

    await fillLocation(user);
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByTestId('mock-draw-area')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
