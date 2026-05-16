import { describe, it, expect } from 'vitest';
import { ProjectSchema } from '@/types/project';
import { ExpertSchema } from '@/types/expert';
import { mockApi } from '@/services/mockApi';

describe('mockApi data schema validation', () => {
  it('all mock projects pass ProjectSchema', async () => {
    const projects = await mockApi.getProjects();
    expect(projects.length).toBeGreaterThan(0);
    for (const p of projects) {
      const result = ProjectSchema.safeParse(p);
      if (!result.success) {
        console.error(`PROJECT FAIL: ${p.name}`, result.error.issues);
      }
      expect(result.success).toBe(true);
    }
  });

  it('all mock experts pass ExpertSchema', async () => {
    const experts = await mockApi.getExperts();
    expect(experts.length).toBeGreaterThan(0);
    for (const e of experts) {
      const result = ExpertSchema.safeParse(e);
      if (!result.success) {
        console.error(`EXPERT FAIL: ${e.name}`, result.error.issues);
      }
      expect(result.success).toBe(true);
    }
  });

  it('data has countries and expert fields populated', async () => {
    const projects = await mockApi.getProjects();
    const experts = await mockApi.getExperts();
    expect(projects.every(p => Array.isArray(p.countries) && p.countries.length > 0)).toBe(true);
    expect(projects.every(p => Array.isArray(p.expertIds) && p.expertIds.length > 0)).toBe(true);
    expect(projects.every(p => Array.isArray(p.teamMembers) && p.teamMembers.length > 0)).toBe(true);
    expect(experts.every(e => Array.isArray(e.countries) && e.countries.length > 0)).toBe(true);
  });
});
