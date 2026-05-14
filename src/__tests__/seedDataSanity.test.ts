import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('seed data sanity checks', () => {
  it('uses local expert portrait paths instead of broken sample image URLs', () => {
    const seedSql = readFileSync(resolve(__dirname, '../../supabase/seed-v3-adjusted-data.sql'), 'utf-8');

    expect(seedSql).not.toContain('https://example.com/profile-pictures');
    expect(seedSql).toMatch(/\/profile-pictures\/[0-9a-f-]{36}\.jpg/);
  });

  it('only assigns seeded expert portrait paths that exist in public assets', () => {
    const seedSql = readFileSync(resolve(__dirname, '../../supabase/seed-v3-adjusted-data.sql'), 'utf-8');
    const availablePortraits = new Set(
      readdirSync(resolve(__dirname, '../../public/profile-pictures'))
        .filter((file) => file.endsWith('.jpg'))
        .map((file) => `/profile-pictures/${file}`)
    );
    const assignedPortraits = [...seedSql.matchAll(/'(?<path>\/profile-pictures\/[0-9a-f-]{36}\.jpg)'/g)]
      .map((match) => match.groups?.path)
      .filter((path): path is string => Boolean(path));

    expect(assignedPortraits.length).toBeGreaterThan(0);
    expect(new Set(assignedPortraits).size).toBe(assignedPortraits.length);
    expect(assignedPortraits.every((portraitPath) => availablePortraits.has(portraitPath))).toBe(true);
  });
});
