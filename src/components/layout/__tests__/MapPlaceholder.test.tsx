// src/components/layout/__tests__/MapPlaceholder.test.tsx
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapPlaceholder } from '../MapPlaceholder';

describe('MapPlaceholder', () => {
  it('renders map placeholder with correct aria-label', () => {
    render(<MapPlaceholder />);
    const mapArea = screen.getByLabelText('Map visualization area');
    expect(mapArea).toBeInTheDocument();
  });

  it('displays interactive map heading', () => {
    render(<MapPlaceholder />);
    expect(screen.getByText(/Interactive Map/i)).toBeInTheDocument();
  });

  it('shows leaflet integration message', () => {
    render(<MapPlaceholder />);
    expect(screen.getByText(/Leaflet integration/i)).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    render(<MapPlaceholder />);
    const container = screen.getByLabelText('Map visualization area');
    expect(container).toHaveClass('bg-surface-muted', 'rounded-xl', 'border-dashed');
  });
});
