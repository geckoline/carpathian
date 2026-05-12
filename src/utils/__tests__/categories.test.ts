import { describe, expect, it } from 'vitest';
import { getCategoryLabel, getCategoryOptions, normalizeCategoryId } from '@/utils/categories';

describe('category taxonomy', () => {
  it('normalizes canonical labels and ids', () => {
    expect(normalizeCategoryId('Water')).toBe('water');
    expect(normalizeCategoryId('climate-change')).toBe('climate-change');
    expect(getCategoryLabel('forests')).toBe('Forests');
  });

  it('maps legacy aliases and typos to canonical categories', () => {
    expect(normalizeCategoryId('Wather')).toBe('water');
    expect(normalizeCategoryId('Agreculture')).toBe('agriculture');
    expect(normalizeCategoryId('Hydrology')).toBe('water');
    expect(normalizeCategoryId('Wildlife')).toBe('biodiversity');
    expect(normalizeCategoryId('air')).toBe('climate-change');
    expect(normalizeCategoryId('Spatial Development')).toBe('spatial-planning');
  });

  it('exposes short canonical labels in stable sort order', () => {
    expect(getCategoryOptions().map((category) => category.label)).toEqual([
      'Biodiversity',
      'Spatial Planning',
      'Water',
      'Agriculture',
      'Forests',
      'Tourism',
      'Cultural Heritage',
      'Industry & Infrastructure',
      'Awareness & Education',
      'Climate Change',
    ]);
  });
});
