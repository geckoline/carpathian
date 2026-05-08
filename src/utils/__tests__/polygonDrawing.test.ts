// src/utils/__tests__/polygonDrawing.test.ts
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { validatePolygon, calculateBoundingBox, simplifyCoords, initializeDrawState } from '../../utils/polygonDrawing';

describe('polygonDrawing', () => {
  it('rejects invalid polygons (<3 points or out of bounds)', () => {
    expect(validatePolygon([[47, 25]])).toBe(false);
    expect(validatePolygon([[999, 999], [47, 25], [48, 26]])).toBe(false);
    expect(validatePolygon([[47, 25], [48, 26], [49, 27]])).toBe(true);
  });

  it('calculates accurate bounding box', () => {
    const coords = [[47, 25], [49, 28], [46, 26]] as [number, number][];
    const box = calculateBoundingBox(coords);
    expect(box).toEqual({ minLat: 46, maxLat: 49, minLng: 25, maxLng: 28 });
  });

  it('simplifies large coordinate sets', () => {
    const long = Array.from({ length: 50 }, (_, i) => [47 + i * 0.1, 25 + i * 0.1] as [number, number]);
    const simplified = simplifyCoords(long);
    expect(simplified.length).toBeLessThan(long.length);
    expect(simplified.length).toBeGreaterThan(2);
  });

  it('initializes clean draw state', () => {
    const state = initializeDrawState();
    expect(state.isDrawing).toBe(false);
    expect(state.currentCoords).toEqual([]);
  });
});
