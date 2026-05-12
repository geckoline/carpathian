import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddProjectModal } from '../AddProjectModal';

const storeMock = vi.hoisted(() => ({
  draftPolygon: null as [number, number][] | null,
  setDraftPolygon: vi.fn(),
  experts: [{
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Dr. Elena Popescu',
    institution: 'University of Bucharest',
  }],
}));

// Mock Modal component
vi.mock('@/components/common/Modal', () => ({
  Modal: ({ children, isOpen, title }: any) => 
    isOpen ? <div data-testid="modal"><div>{title}</div>{children}</div> : null,
}));

// Mock store
vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn((selector?: Function) => {
    const state = {
      data: { experts: storeMock.experts },
      draftPolygon: storeMock.draftPolygon,
      setDraftPolygon: storeMock.setDraftPolygon,
    };
    return selector ? selector(state) : state;
  }),
}));

// Mock react-leaflet (needed because MapDrawingControl imports react-leaflet)
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  useMap: () => ({ on: vi.fn(), off: vi.fn() }),
  Polygon: ({ positions }: any) => <div data-testid="map-polygon" data-positions={JSON.stringify(positions)} />,
}));

// Mock leaflet-draw
vi.mock('leaflet-draw', () => ({
  default: {
    Event: { CREATED: 'draw:created' },
    Control: {
      Draw: vi.fn(() => ({ addTo: vi.fn() })),
    },
    FeatureGroup: vi.fn(() => ({ addLayer: vi.fn() })),
    Polygon: vi.fn(),
  },
}));

// Mock MapDrawingWrapper to avoid Leaflet initialization in tests
vi.mock('@/components/map/MapDrawingWrapper', () => ({
  MapDrawingWrapper: ({ onPolygonCreated }: any) => (
    <div data-testid="map-drawing-wrapper">
      <button 
        data-testid="mock-draw-button"
        onClick={() => onPolygonCreated([[47.5, 25.0], [47.6, 25.1], [47.4, 25.2]])}
      >
        Mock Draw Polygon
      </button>
      <button
        data-testid="mock-invalid-draw-button"
        onClick={() => onPolygonCreated([[47.5, 25.0], [47.6, 25.1]])}
      >
        Mock Invalid Polygon
      </button>
    </div>
  ),
}));

describe('AddProjectModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    storeMock.draftPolygon = null;
    storeMock.experts = [{
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Dr. Elena Popescu',
      institution: 'University of Bucharest',
    }];
    mockOnSubmit.mockResolvedValue(undefined);
  });

  const fillValidProject = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/project name/i), 'Test Project');
    await user.selectOptions(screen.getByLabelText(/status/i), 'active');
    await user.selectOptions(screen.getByTestId('add-project-field-input'), 'biodiversity');
    await user.type(screen.getByLabelText(/description/i), 'This is a test project description with enough characters to pass validation');
    await user.type(screen.getByLabelText(/location/i), 'Romania');
    await user.clear(screen.getByLabelText(/year range/i));
    await user.type(screen.getByLabelText(/year range/i), '2024-2028');
  };

  it('renders form fields', () => {
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
  });

  it('calls onSubmit with valid data', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    
    await fillValidProject(user);

    await user.click(screen.getByTestId('add-project-submit'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Project',
        status: 'active',
        field: 'biodiversity',
        leadExpertId: '123e4567-e89b-12d3-a456-426614174001',
      }));
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('persists drawn polygon coordinates and submits them with the project', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await user.click(screen.getByTestId('mock-draw-button'));

    expect(storeMock.setDraftPolygon).toHaveBeenCalledWith([[47.5, 25.0], [47.6, 25.1], [47.4, 25.2]]);
    expect(screen.getByText(/3 area points selected/i)).toBeInTheDocument();

    await fillValidProject(user);
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

    await user.click(screen.getByTestId('mock-draw-button'));
    await user.click(screen.getByRole('button', { name: /clear project area/i }));
    await fillValidProject(user);
    await user.click(screen.getByTestId('add-project-submit'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    expect(storeMock.setDraftPolygon).toHaveBeenLastCalledWith(null);
    expect(mockOnSubmit.mock.calls[0][0].areaCoords).toBeUndefined();
  });

  it('validates polygon minimum points before submit', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await user.click(screen.getByTestId('mock-invalid-draw-button'));
    await fillValidProject(user);
    await user.click(screen.getByTestId('add-project-submit'));

    expect(await screen.findByRole('alert')).toHaveTextContent(/polygon needs/i);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows submit error and keeps modal open when onSubmit rejects', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Project could not be saved'));
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await fillValidProject(user);
    await user.click(screen.getByTestId('add-project-submit'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Project could not be saved');
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('disables submit while offline', () => {
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isOnline={false} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/offline/i);
    expect(screen.getByTestId('add-project-submit')).toBeDisabled();
  });

  it('disables submit until a leading expert exists', () => {
    storeMock.experts = [];
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    expect(screen.getByText(/leading expert must already exist/i)).toBeInTheDocument();
    expect(screen.getByTestId('add-project-submit')).toBeDisabled();
  });

  it('closes modal on cancel', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
