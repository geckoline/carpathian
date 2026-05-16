import { describe, expect, it } from 'vitest';
import { getDatasetExperts, getDatasetProjects } from '../datasetScope';
import type { ExpertData } from '@/types/expert';
import type { ProjectData } from '@/types/project';

const projects = [
  {
    id: 'p1',
    name: 'CS Lead Project',
    status: 'active',
    field: 'Biodiversity',
    description: 'A citizen science project with a lead expert.',
    location: 'Romania',
    yearRange: '2024-2028',
    lat: 47,
    lng: 25,
    expertIds: ['e1', 'e5'],
    teamMembers: [{ id: 'e1', name: 'Lead Expert' }, { id: 'e5', name: 'Linked Contributor' }],
    countries: ['RO'],
    isCitizenScience: true,
  },
  {
    id: 'p2',
    name: 'CS Contact Project',
    status: 'planned',
    field: 'Water',
    description: 'A citizen science project with an email contact.',
    location: 'Slovakia',
    yearRange: '2025-2028',
    lat: 48,
    lng: 20,
    expertIds: ['e2'],
    teamMembers: [{ id: 'e2', name: 'Contact Expert' }],
    countries: ['SK'],
    contact: ' CONTACT@example.com ',
    isCitizenScience: true,
  },
  {
    id: 'p3',
    name: 'Non-CS Project',
    status: 'active',
    field: 'Forest',
    description: 'A non citizen science project.',
    location: 'Poland',
    yearRange: '2022-2026',
    lat: 49,
    lng: 21,
    expertIds: ['e3'],
    teamMembers: [{ id: 'e3', name: 'Non-CS Expert' }],
    countries: ['PL'],
    isCitizenScience: false,
  },
  {
    id: 'p4',
    name: 'Unflagged Legacy Project',
    status: 'active',
    field: 'Climate Change',
    description: 'A legacy project without the explicit CS flag.',
    location: 'Austria',
    yearRange: '2021-2026',
    lat: 47,
    lng: 16,
    expertIds: ['e4'],
    teamMembers: [{ id: 'e4', name: 'Unrelated Expert' }],
    countries: ['AT'],
  },
] as ProjectData[];

const experts = [
  { id: 'e1', name: 'Lead Expert', email: 'lead@example.com' },
  { id: 'e2', name: 'Contact Expert', email: 'contact@example.com' },
  { id: 'e3', name: 'Non-CS Expert', email: 'non-cs@example.com', isCitizenScience: true },
  { id: 'e4', name: 'Unrelated Expert', email: 'other@example.com', isCitizenScience: true },
  { id: 'e5', name: 'Linked Contributor', email: 'linked@example.com', isCitizenScience: true },
] as ExpertData[];

describe('dataset scope utilities', () => {
  it('limits citizen science projects to explicit CS projects', () => {
    expect(getDatasetProjects('cs', projects).map((project) => project.id)).toEqual(['p1', 'p2']);
  });

  it('keeps all projects in all-Carpathian mode', () => {
    expect(getDatasetProjects('all', projects)).toHaveLength(4);
  });

  it('limits citizen science experts to all CS linked experts and contacts', () => {
    expect(getDatasetExperts('cs', projects, experts).map((expert) => expert.id)).toEqual(['e1', 'e2', 'e5']);
  });

  it('keeps all experts in all-Carpathian mode', () => {
    expect(getDatasetExperts('all', projects, experts)).toHaveLength(5);
  });
});
