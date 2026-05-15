import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockApi } from '../mockApi';
import { getLocalExpertPortraitPaths } from '@/components/cards/expertProfileImage';

describe('mockApi expert sample data', () => {
  it('enriches dummy experts with varied social profile fields without storing derived portraits', async () => {
    const experts = await mockApi.getExperts();
    const sample = experts.slice(0, 10);

    expect(sample.length).toBeGreaterThan(0);
    expect(sample.every((expert) => !('avatarUrl' in expert))).toBe(true);
    expect(sample.some((expert) => expert.orcid)).toBe(true);
    expect(sample.some((expert) => expert.googleScholar)).toBe(true);
    expect(sample.some((expert) => expert.scopus)).toBe(true);
    expect(sample.some((expert) => expert.email)).toBe(true);
  });

  it('each existing local portrait file matches an expert', async () => {
    const experts = await mockApi.getExperts();
    const expertsWithLocalFiles = experts.filter(
      (e) => getLocalExpertPortraitPaths(e.id).some(
        (portraitPath) => existsSync(resolve(process.cwd(), 'public', portraitPath.replace(/^\//, '')))
      )
    );
    expect(expertsWithLocalFiles.length).toBeGreaterThanOrEqual(3);
  });
});
