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
    expertIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],
    teamMembers: [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Dr. River' }],
    countries: ['RO'],
    lat: 47,
    lng: 25,
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
    expertIds: ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
    teamMembers: [{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Dr. Forest' }],
    countries: ['SK'],
    lat: 48,
    lng: 21,
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
    expertIds: ['cccccccc-cccc-4ccc-8ccc-cccccccccccc'],
    teamMembers: [{ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', name: 'Dr. Tourism' }],
    countries: ['PL'],
    lat: 49,
    lng: 20,
  },
];

describe('getProjectFilterOptions', () => {
  it('limits category and country options by the selected status', () => {
    const options = getProjectFilterOptions(projects, { ...baseFilters, statusFilter: 'active' });

    expect(options.categories.map((category) => category.id)).toEqual(['water', 'forests']);
    expect(options.countries).toEqual(['RO', 'SK']);
  });

  it('limits category options by the selected country and country options by the selected category', () => {
    const countryScoped = getProjectFilterOptions(projects, { ...baseFilters, countryFilter: 'RO' });
    const fieldScoped = getProjectFilterOptions(projects, { ...baseFilters, fieldFilter: 'forests' });

    expect(countryScoped.categories.map((category) => category.id)).toEqual(['water']);
    expect(fieldScoped.countries).toEqual(['SK']);
  });
});
