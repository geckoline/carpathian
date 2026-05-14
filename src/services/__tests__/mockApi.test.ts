import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
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

  it('assigns every available local portrait to one demo expert', async () => {
    const experts = await mockApi.getExperts();
    const availablePortraits = readdirSync(resolve(process.cwd(), 'public/profile-pictures'))
      .filter((file) => file.endsWith('.jpg'))
      .map((file) => `/profile-pictures/${file}`)
      .sort();
    const assignedPortraits = experts
      .map((expert) => expert.avatarUrl)
      .filter((avatarUrl): avatarUrl is string => Boolean(avatarUrl))
      .sort();

    expect(assignedPortraits).toEqual(availablePortraits);
  });
});
