// src/utils/__tests__/polygonUtils.test.ts
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import type { LatLngTuple } from 'leaflet';
import { getPolygonStyle, generateMockPolygon, normalizeCoords } from '../../utils/polygonUtils';

describe('polygonUtils', () => {
  it('returns correct style for active biodiversity project', () => {
    const style = getPolygonStyle('active', 'biodiversity');
    expect(style.fillColor).toBe('#ADFF2F');
    expect(style.color).toBe('#9ACD32');
    expect(style.fillOpacity).toBe(0.35);
  });

  it('falls back to active style for unknown status', () => {
    const style = getPolygonStyle('unknown');
    expect(style.fillColor).toBe('#006633');
    expect(style.color).toBe('#006633');
    expect(style.fillOpacity).toBe(0.3);
  });

  it('generates valid mock polygon coordinates', () => {
    const polygon = generateMockPolygon(47.5, 25.0, 10, 4);
    expect(polygon).toHaveLength(4);
    polygon.forEach(([lat, lng]) => {
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lng).toBeGreaterThanOrEqual(-180);
    });
  });

  it('normalizes and filters invalid coordinates', () => {
    const raw: LatLngTuple[] = [[47.123456, 25.987654], [999, 999], [-45.5, 10.2]];
    const normalized = normalizeCoords(raw);
    expect(normalized).toHaveLength(2);
    expect(normalized[0]).toEqual([47.123, 25.988]);
    expect(normalized[1]).toEqual([-45.5, 10.2]);
  });
});
