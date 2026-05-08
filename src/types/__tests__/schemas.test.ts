import { describe, it, expect } from 'vitest';
import { ProjectSchema } from '@/types/project';
import { ExpertSchema } from '@/types/expert';

describe('Zod Schemas', () => {
  it('validates a complete project', () => {
    const validProject = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Carpathian Watch',
      status: 'active' as const,
      field: 'Biodiversity',
      description: 'Monitoring deforestation across northern ranges.',
      location: '3 Countries',
      yearRange: '2021-2025',
      lat: 47,
      lng: 25,
    };
    expect(ProjectSchema.parse(validProject)).toEqual(validProject);
  });

  it('rejects invalid project data', () => {
    const invalid = { name: 'Too short', status: 'invalid' };
    expect(() => ProjectSchema.parse(invalid)).toThrow();
  });

  it('validates a complete expert', () => {
    const validExpert = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Dr. Elena Popescu',
      institution: 'Univ. of Bucharest',
      country: 'Romania',
      degree: 'PhD, Ecology',
      bio: 'Leading research on Carpathian biodiversity for over 15 years.',
      expertise: ['Alpine Eco', 'Climate Resilience'],
    };
    expect(ExpertSchema.parse(validExpert)).toEqual(validExpert);
  });
});
