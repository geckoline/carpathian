import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MapPerformanceWrapper } from '../MapPerformanceWrapper';

// ✅ Mock the lazy-loaded MapView to bypass Vite chunk resolution
vi.mock('@/components/map/MapView', () => ({
  default: () => <div data-testid="map-loaded" />,
  MapView: () => <div data-testid="map-loaded" />,
}));

describe('MapPerformanceWrapper', () => {
  it('shows placeholder when not visible', () => {
    render(<MapPerformanceWrapper isVisible={false} />);
    expect(screen.getByText('Loading map...')).toBeInTheDocument();
  });

  it('lazy mounts map when visible', async () => {
    render(<MapPerformanceWrapper isVisible={true} />);
    await waitFor(() => expect(screen.getByTestId('map-loaded')).toBeInTheDocument(), { timeout: 3000 });
  });
});
