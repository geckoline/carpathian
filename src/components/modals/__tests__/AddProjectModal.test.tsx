import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddProjectModal } from '../AddProjectModal';

// Mock Modal component
vi.mock('@/components/common/Modal', () => ({
  Modal: ({ children, isOpen, title }: any) => 
    isOpen ? <div data-testid="modal"><div>{title}</div>{children}</div> : null,
}));

// Mock store
vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn((selector?: Function) => {
    const state = { experts: [], draftPolygon: null, setDraftPolygon: vi.fn() };
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
    </div>
  ),
}));

describe('AddProjectModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

  it('renders form fields', () => {
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
  });

  it('calls onSubmit with valid data', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByLabelText(/project name/i), 'Test Project');
    await user.selectOptions(screen.getByLabelText(/status/i), 'active');
    await user.type(screen.getByTestId('add-project-field-input'), 'Biodiversity');
    await user.type(screen.getByLabelText(/description/i), 'This is a test project description with enough characters to pass validation');
    await user.type(screen.getByLabelText(/location/i), 'Romania');
    await user.clear(screen.getByLabelText(/year range/i));
    await user.type(screen.getByLabelText(/year range/i), '2024-2028');

    await user.click(screen.getByTestId('add-project-submit'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Project',
        status: 'active',
        field: 'Biodiversity',
      }));
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal on cancel', async () => {
    const user = userEvent.setup();
    render(<AddProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
