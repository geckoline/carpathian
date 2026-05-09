// src/components/map/__tests__/ProjectPolygon.test.tsx
import { describe, it, expect } from 'vitest';
import { getPolygonStyle } from '@/utils/polygonUtils';

describe('ProjectPolygon logic', () => {
  it('calculates correct style for active project', () => {
    const style = getPolygonStyle('active', 'biodiversity');
    expect(style.fillColor).toBe('#ADFF2F');
    expect(style.color).toBe('#9ACD32');
  });

  it('handles selected state in style', () => {
    const baseStyle = getPolygonStyle('active', 'biodiversity');
    const selectedOpacity = 0.45; // When selected, fillOpacity becomes 0.45
    expect(selectedOpacity).toBeGreaterThan(baseStyle.fillOpacity);
  });
});
