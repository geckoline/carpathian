import { describe, it, expect } from 'vitest';
import { mockApi } from '../mockApi';
import { ProjectSchema } from '@/types/project';
import { ExpertSchema } from '@/types/expert';
import { getLocalExpertPortraitPath, getLocalExpertPortraitPaths } from '@/components/cards/expertProfileImage';

describe('Mock API - Data Integrity', () => {
  describe('Project Data', () => {
    it('all mock projects pass Zod validation', async () => {
      const projects = await mockApi.getProjects();

      projects.forEach((project, index) => {
        const result = ProjectSchema.safeParse(project);
        if (!result.success) {
          throw new Error(`Project ${index} validation failed: ${result.error.message}`);
        }
      });

      expect(projects).toHaveLength(12);
    });

    it('projects have valid geographic coordinates', async () => {
      const projects = await mockApi.getProjects();

      projects.forEach(project => {
        expect(project.lat).toBeGreaterThanOrEqual(-90);
        expect(project.lat).toBeLessThanOrEqual(90);
        expect(project.lng).toBeGreaterThanOrEqual(-180);
        expect(project.lng).toBeLessThanOrEqual(180);
      });
    });

    it('projects have valid year ranges', async () => {
      const projects = await mockApi.getProjects();
      const yearRegex = /^\d{4}-\d{4}$/;

      projects.forEach(project => {
        expect(project.yearRange).toMatch(yearRegex);
        const [start, end] = project.yearRange.split('-').map(Number);
        expect(start!).toBeLessThanOrEqual(end!);
        expect(start).toBeGreaterThanOrEqual(2018);
      });
    });

    it('status values are enum-compliant', async () => {
      const projects = await mockApi.getProjects();
      const validStatuses = ['active', 'past', 'planned'] as const;

      projects.forEach(project => {
        expect(validStatuses).toContain(project.status);
      });
    });
  });

  describe('Expert Data', () => {
    it('all mock experts pass Zod validation', async () => {
      const experts = await mockApi.getExperts();

      experts.forEach((expert, index) => {
        const result = ExpertSchema.safeParse(expert);
        if (!result.success) {
          throw new Error(`Expert ${index} validation failed: ${result.error.message}`);
        }
      });

      expect(experts).toHaveLength(42);
    });

    it('experts have at least one contact method', async () => {
      const experts = await mockApi.getExperts();

      experts.forEach(expert => {
        const hasContact = !!(expert.email || expert.linkedin || expert.scopus);
        expect(hasContact).toBe(true);
      });
    });

    it('expertise arrays are non-empty', async () => {
      const experts = await mockApi.getExperts();

      experts.forEach(expert => {
        expect(expert.expertise.length).toBeGreaterThan(0);
        expert.expertise.forEach(skill => {
          expect(skill.trim()).toBeTruthy();
        });
      });
    });

    it('portrait paths in mockApi match public directory file naming', async () => {
      const data = await mockApi.getExperts();
      data.forEach((expert: { id: string }) => {
        const portraitPath = getLocalExpertPortraitPath(expert.id);
        expect(portraitPath).toMatch(/^\/profile-pictures\/[0-9a-f-]+\.jpg$/);
        expect(getLocalExpertPortraitPaths(expert.id)).toEqual([
          `/profile-pictures/${expert.id}.jpg`,
          `/profile-pictures/${expert.id}.png`,
          `/profile-pictures/${expert.id}.webp`,
        ]);
      });
    });
  });

  describe('Cross-Reference Integrity', () => {
    it('every project has a leading expert that references an existing expert card', async () => {
      const [projects, experts] = await Promise.all([
        mockApi.getProjects(),
        mockApi.getExperts(),
      ]);

      const expertIds = new Set(experts.map(e => e.id));

      projects.forEach(project => {
        expect(project.leadExpertId).toBeTruthy();
        expect(project.leadExpertName).toBeTruthy();
        expect(expertIds).toContain(project.leadExpertId);
      });
    });

    it('no duplicate IDs across projects or experts', async () => {
      const [projects, experts] = await Promise.all([
        mockApi.getProjects(),
        mockApi.getExperts(),
      ]);

      const projectIds = projects.map(p => p.id);
      const expertIds = experts.map(e => e.id);

      expect(new Set(projectIds).size).toBe(projectIds.length);
      expect(new Set(expertIds).size).toBe(expertIds.length);

      const allIds = [...projectIds, ...expertIds];
      expect(new Set(allIds).size).toBe(allIds.length);
    });
  });
});
