import { describe, expect, it } from 'vitest';
import { getProjectFilterOptions } from '../projectFilterOptions';
import type { FilterState } from '@/types/app';
import type { ProjectData } from '@/types/project';

const baseFilters: FilterState = {
  searchTerm: '',
  statusFilter: 'all',
  fieldFilter: 'all',
  countryFilter: 'all',
  activeTab: 'projects',
  sortKey: 'name',
  sortDirection: 'asc',
};

const projects: ProjectData[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Active Water',
    status: 'active',
    categoryId: 'water',
    field: 'Water',
    description: 'River monitoring project in the Carpathians.',
    location: 'Romania',
    yearRange: '2024-2028',
    leadExpertId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    leadExpertName: 'Dr. River',
    lat: 47,
    lng: 25,
    country: 'Romania',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Active Forest',
    status: 'active',
    categoryId: 'forests',
    field: 'Forests',
    description: 'Forest canopy monitoring project.',
    location: 'Slovakia',
    yearRange: '2024-2028',
    leadExpertId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    leadExpertName: 'Dr. Forest',
    lat: 48,
    lng: 21,
    country: 'Slovakia',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Planned Tourism',
    status: 'planned',
    categoryId: 'tourism',
    field: 'Tourism',
    description: 'Tourism pressure mapping project.',
    location: 'Poland',
    yearRange: '2026-2030',
    leadExpertId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    leadExpertName: 'Dr. Tourism',
    lat: 49,
    lng: 20,
    country: 'Poland',
  },
];

describe('getProjectFilterOptions', () => {
  it('limits category and country options by the selected status', () => {
    const options = getProjectFilterOptions(projects, { ...baseFilters, statusFilter: 'active' });

    expect(options.categories.map((category) => category.id)).toEqual(['water', 'forests']);
    expect(options.countries).toEqual(['Romania', 'Slovakia']);
  });

  it('limits category options by the selected country and country options by the selected category', () => {
    const countryScoped = getProjectFilterOptions(projects, { ...baseFilters, countryFilter: 'Romania' });
    const fieldScoped = getProjectFilterOptions(projects, { ...baseFilters, fieldFilter: 'forests' });

    expect(countryScoped.categories.map((category) => category.id)).toEqual(['water']);
    expect(fieldScoped.countries).toEqual(['Slovakia']);
  });
});
