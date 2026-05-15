import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockApi } from '../mockApi';

describe('mockApi expert sample data', () => {
  it('enriches dummy experts with local portraits and varied social profile fields', async () => {
    const experts = await mockApi.getExperts();
    const sample = experts.slice(0, 10);

    expect(sample.length).toBeGreaterThan(0);
    expect(sample.every((expert) => expert.avatarUrl?.startsWith('/profile-pictures/'))).toBe(true);
    expect(sample.some((expert) => expert.orcid)).toBe(true);
    expect(sample.some((expert) => expert.googleScholar)).toBe(true);
    expect(sample.some((expert) => expert.scopus)).toBe(true);
    expect(sample.some((expert) => expert.email)).toBe(true);
  });

  it('each existing local portrait file matches an expert', async () => {
    const experts = await mockApi.getExperts();
    const expertsWithLocalFiles = experts.filter(
      (e) => e.avatarUrl && existsSync(resolve(process.cwd(), 'public', e.avatarUrl.replace(/^\//, '')))
    );
    expect(expertsWithLocalFiles.length).toBeGreaterThanOrEqual(3);
  });
});
