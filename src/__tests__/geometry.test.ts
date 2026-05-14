import { describe, it, expect } from 'vitest';
import { simplifyPolygon, generateAutoCircle } from '@/utils/geometry';

describe('simplifyPolygon', () => {
  it('returns same points when under maxPoints', () => {
    const coords: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
    const result = simplifyPolygon(coords, 10);
    expect(result).toEqual(coords);
  });

  it('reduces collinear points when over maxPoints', () => {
    const coords: [number, number][] = [];
    for (let i = 0; i < 50; i++) {
      coords.push([0, i * 0.1]);
    }
    for (let i = 0; i < 50; i++) {
      coords.push([i * 0.1, 5]);
    }
    coords.push([0, 0]);
    const result = simplifyPolygon(coords, 10);
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('preserves first and last point', () => {
    const coords: [number, number][] = [[0, 0], [0.1, 0.1], [0.2, 0.3], [0.5, 0.8], [1, 1], [0, 0]];
    const result = simplifyPolygon(coords, 3);
    expect(result[0]).toEqual([0, 0]);
    expect(result[result.length - 1]).toEqual([0, 0]);
  });

  it('returns empty array for empty input', () => {
    expect(simplifyPolygon([], 10)).toEqual([]);
  });

  it('returns same points for 3-point triangle', () => {
    const triangle: [number, number][] = [[0, 0], [1, 0], [0.5, 1], [0, 0]];
    const result = simplifyPolygon(triangle, 5);
    expect(result).toEqual(triangle);
  });

  it('handles single point', () => {
    const result = simplifyPolygon([[5, 5]], 10);
    expect(result).toEqual([[5, 5]]);
  });

  it('handles two points', () => {
    const result = simplifyPolygon([[0, 0], [1, 1]], 10);
    expect(result).toEqual([[0, 0], [1, 1]]);
  });
});

describe('generateAutoCircle', () => {
  it('generates circle with specified number of points', () => {
    const result = generateAutoCircle([47.5, 25], 25, 32);
    expect(result.length).toBe(33); // 32 + closing point
  });

  it('generates circle with default points (32)', () => {
    const result = generateAutoCircle([47.5, 25], 25);
    expect(result.length).toBe(33);
  });

  it('first and last point are the same (closed circle)', () => {
    const result = generateAutoCircle([47.5, 25], 25, 32);
    expect(result[0][0]).toBeCloseTo(result[result.length - 1][0], 10);
    expect(result[0][1]).toBeCloseTo(result[result.length - 1][1], 10);
  });

  it('center remains inside the generated circle', () => {
    const center: [number, number] = [47.5, 25];
    const result = generateAutoCircle(center, 25, 32);
    const lats = result.map(p => p[0]);
    const lngs = result.map(p => p[1]);
    expect(Math.min(...lats)).toBeLessThan(center[0]);
    expect(Math.max(...lats)).toBeGreaterThan(center[0]);
    expect(Math.min(...lngs)).toBeLessThan(center[1]);
    expect(Math.max(...lngs)).toBeGreaterThan(center[1]);
  });

  it('generates roughly circular shape', () => {
    const center: [number, number] = [47.5, 25];
    const result = generateAutoCircle(center, 25, 32);
    const radiusValues = result.slice(0, -1).map(p => {
      const dlat = p[0] - center[0];
      const dlng = p[1] - center[1];
      return Math.sqrt(dlat * dlat + dlng * dlng);
    });
    const mean = radiusValues.reduce((a, b) => a + b, 0) / radiusValues.length;
    const maxDeviation = Math.max(...radiusValues.map(r => Math.abs(r - mean)));
    expect(maxDeviation / mean).toBeLessThan(0.3);
  });

  it('generates larger circle for larger radius', () => {
    const small = generateAutoCircle([47.5, 25], 10, 32);
    const large = generateAutoCircle([47.5, 25], 50, 32);
    const smallMaxLat = Math.max(...small.map(p => p[0]));
    const largeMaxLat = Math.max(...large.map(p => p[0]));
    expect(largeMaxLat).toBeGreaterThan(smallMaxLat);
  });

  it('throws for negative radius', () => {
    expect(() => generateAutoCircle([47.5, 25], -1, 32)).toThrow();
  });
});
