import { describe, it, expect } from 'vitest';
import { parseGeometryString, getPolygonCoords, isPointGeometry } from '../geometryUtils';

describe('parseGeometryString', () => {
  it('parses POINT WKT', () => {
    const result = parseGeometryString("geometry('POINT(25.0 47.5)', 4326)");
    expect(result).toEqual({ type: 'Point', coordinates: [47.5, 25.0] });
  });

  it('parses POLYGON WKT', () => {
    const result = parseGeometryString("geometry('POLYGON((25.0 47.5, 26.0 48.0, 24.5 48.5, 25.0 47.5))', 4326)");
    expect(result?.type).toBe('Polygon');
    if (result?.type === 'Polygon') {
      expect(result.coordinates.length).toBeGreaterThanOrEqual(3);
      expect(result.coordinates[0]).toEqual([47.5, 25.0]);
    }
  });

  it('returns null for malformed WKT', () => {
    expect(parseGeometryString('')).toBeNull();
    expect(parseGeometryString('not wkt')).toBeNull();
  });

  it('returns null for invalid POINT coordinates', () => {
    expect(parseGeometryString("geometry('POINT(x y)', 4326)")).toBeNull();
  });

  it('returns null for POLYGON with fewer than 3 points', () => {
    expect(parseGeometryString("geometry('POLYGON((25.0 47.5, 26.0 48.0))', 4326)")).toBeNull();
  });

  it('handles POLYGON with multiple rings (takes first)', () => {
    const result = parseGeometryString("geometry('POLYGON((25.0 47.5, 26.0 48.0, 24.5 48.5, 25.0 47.5),(25.5 47.8, 25.8 48.2, 25.2 48.0, 25.5 47.8))', 4326)");
    expect(result?.type).toBe('Polygon');
  });
});

describe('getPolygonCoords', () => {
  it('extracts coords from polygon WKT', () => {
    const coords = getPolygonCoords("geometry('POLYGON((25.0 47.5, 26.0 48.0, 24.5 48.5, 25.0 47.5))', 4326)");
    expect(coords!.length).toBeGreaterThanOrEqual(3);
  });

  it('returns null for point WKT', () => {
    expect(getPolygonCoords("geometry('POINT(25.0 47.5)', 4326)")).toBeNull();
  });
});

describe('isPointGeometry', () => {
  it('returns true for POINT WKT', () => {
    expect(isPointGeometry("geometry('POINT(25.0 47.5)', 4326)")).toBe(true);
  });

  it('returns false for POLYGON WKT', () => {
    expect(isPointGeometry("geometry('POLYGON((25.0 47.5, 26.0 48.0, 24.5 48.5, 25.0 47.5))', 4326)")).toBe(false);
  });

  it('returns false for malformed input', () => {
    expect(isPointGeometry('')).toBe(false);
  });
});
