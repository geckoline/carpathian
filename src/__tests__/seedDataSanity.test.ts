import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('seed data sanity checks', () => {
  it('uses local expert portrait paths instead of broken sample image URLs', () => {
    const seedSql = readFileSync(resolve(__dirname, '../../supabase/seed-v3-adjusted-data.sql'), 'utf-8');

    expect(seedSql).not.toContain('https://example.com/profile-pictures');
    expect(seedSql).toMatch(/\/profile-pictures\/[0-9a-f-]{36}\.jpg/);
  });
});
