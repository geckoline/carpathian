import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TileToggle from '../TileToggle';

const leafletMocks = vi.hoisted(() => {
  const addTo = vi.fn();
  const tileLayer = vi.fn(() => ({ addTo }));
  return { addTo, tileLayer };
});

// Mock Leaflet to avoid DOM/WebGL errors
vi.mock('leaflet', () => ({
  tileLayer: leafletMocks.tileLayer,
}));

describe('TileToggle (Context-Safe)', () => {
  it('renders without calling useMap (no context dependency)', () => {
    // This test ensures TileToggle doesn't use useMap internally
    const mockMap = { eachLayer: vi.fn(), removeLayer: vi.fn() } as any;
    render(
      <TileToggle 
        map={mockMap} 
        activeLayer="street" 
        onLayerChange={vi.fn()} 
      />
    );
    // Should render without context errors
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Map layer toggle');
  });

  it('calls onLayerChange and map methods on toggle', async () => {
    leafletMocks.addTo.mockClear();
    leafletMocks.tileLayer.mockClear();
    const onLayerChange = vi.fn();
    const mockMap = { 
      eachLayer: vi.fn((cb) => cb({ _url: 'openstreetmap' })), 
      removeLayer: vi.fn(),
      addLayer: vi.fn()
    } as any;
    
    render(
      <TileToggle 
        map={mockMap} 
        activeLayer="street" 
        onLayerChange={onLayerChange} 
      />
    );
    
    const satBtn = screen.getByTitle('Satellite View');
    await userEvent.click(satBtn);
    
    expect(onLayerChange).toHaveBeenCalledWith('satellite');
    expect(mockMap.removeLayer).toHaveBeenCalled();
    expect(leafletMocks.tileLayer).toHaveBeenCalledWith(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      expect.objectContaining({ attribution: '&copy; Esri', maxZoom: 19 })
    );
    expect(leafletMocks.addTo).toHaveBeenCalledWith(mockMap);
  });
});
