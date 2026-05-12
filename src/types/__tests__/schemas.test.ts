import { describe, it, expect } from 'vitest';
import { ProjectSchema } from '@/types/project';
import { ExpertSchema } from '@/types/expert';
import { VolunteerSubscriptionSchema } from '@/types/volunteer';

describe('Zod Schemas', () => {
  it('validates a complete project', () => {
    const validProject = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Carpathian Watch',
      status: 'active' as const,
      categoryId: 'biodiversity',
      field: 'Biodiversity',
      description: 'Monitoring deforestation across northern ranges.',
      location: '3 Countries',
      yearRange: '2021-2025',
      leadExpertId: '123e4567-e89b-12d3-a456-426614174001',
      leadExpertName: 'Dr. Elena Popescu',
      lat: 47,
      lng: 25,
    };
    expect(ProjectSchema.parse(validProject)).toEqual(validProject);
  });

  it('rejects invalid project data', () => {
    const invalid = { name: 'Too short', status: 'invalid' };
    expect(() => ProjectSchema.parse(invalid)).toThrow();
  });

  it('rejects projects without a leading expert', () => {
    expect(() => ProjectSchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Carpathian Watch',
      status: 'active',
      field: 'Biodiversity',
      description: 'Monitoring deforestation across northern ranges.',
      location: '3 Countries',
      yearRange: '2021-2025',
      lat: 47,
      lng: 25,
    })).toThrow();
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
      email: 'elena@example.com',
      linkedin: 'https://linkedin.com/in/elena',
      avatarUrl: '/profile-pictures/123e4567-e89b-12d3-a456-426614174001.jpg',
    };
    expect(ExpertSchema.parse(validExpert)).toEqual(validExpert);
  });

  it('rejects unsafe relative expert avatar paths', () => {
    expect(() => ExpertSchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Dr. Elena Popescu',
      institution: 'Univ. of Bucharest',
      country: 'Romania',
      bio: 'Leading research on Carpathian biodiversity for over 15 years.',
      expertise: ['Alpine Eco'],
      avatarUrl: '../profile-pictures/avatar.jpg',
    })).toThrow();
  });

  it('validates a global volunteer subscription', () => {
    const subscription = {
      fullName: 'Test User',
      email: 'test@example.com',
      city: 'Brasov',
      country: 'Romania',
      latitude: 45.6427,
      longitude: 25.5887,
      radiusKm: 75,
      categoryIds: ['biodiversity', 'water'],
      note: 'Available on weekends.',
      consent: true,
    };

    expect(VolunteerSubscriptionSchema.parse(subscription)).toEqual(subscription);
  });

  it('rejects volunteer subscriptions without consent', () => {
    expect(() => VolunteerSubscriptionSchema.parse({
      fullName: 'Test User',
      email: 'test@example.com',
      city: 'Brasov',
      country: 'Romania',
      latitude: 45.6427,
      longitude: 25.5887,
      radiusKm: 75,
      categoryIds: ['biodiversity'],
      consent: false,
    })).toThrow();
  });
});
