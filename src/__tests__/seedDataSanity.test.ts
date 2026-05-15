import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('seed data sanity checks', () => {
  const seedPath = resolve(__dirname, '../../supabase/seed-v3-adjusted-data.sql');
  const schemaPath = resolve(__dirname, '../../supabase/schema-v3-draft.sql');
  const portraitDir = resolve(__dirname, '../../public/profile-pictures');
  const getInsertBlock = (sql: string, table: string) => {
    const insertStart = sql.indexOf(`insert into public.${table}`);
    return sql.slice(insertStart, sql.indexOf('on conflict', insertStart));
  };
  const getIdsFromBlock = (block: string) =>
    [...block.matchAll(/\('([0-9a-f-]{36})'/g)].map((match) => match[1]!);

  it('leaves expert portrait paths to be derived from expert IDs', () => {
    const seedSql = readFileSync(seedPath, 'utf-8');
    const schemaSql = readFileSync(schemaPath, 'utf-8');

    expect(seedSql).not.toContain('https://example.com/profile-pictures');
    expect(seedSql).not.toMatch(/\/profile-pictures\/[0-9a-f-]{36}\.(jpg|png|webp)/);
    expect(seedSql).not.toContain('avatar_url');
    expect(schemaSql).not.toContain('avatar_url');
  });

  it('seeds normalized institutions before experts reference them', () => {
    const seedSql = readFileSync(seedPath, 'utf-8');
    const institutionInsert = seedSql.indexOf('insert into public.institutions');
    const expertInsert = seedSql.indexOf('insert into public.experts');
    const institutionBlock = getInsertBlock(seedSql, 'institutions');
    const expertBlock = getInsertBlock(seedSql, 'experts');
    const institutionIds = new Set([...institutionBlock.matchAll(/\('([^']+)', '[^']+'/g)].map((match) => match[1]));
    const expertInstitutionIds = [...expertBlock.matchAll(/\('[0-9a-f-]{36}', '[^']+', '([^']+)'/g)].map((match) => match[1]);

    expect(institutionInsert).toBeGreaterThan(-1);
    expect(expertInsert).toBeGreaterThan(institutionInsert);
    expect(seedSql).toContain('insert into public.experts (id, name, institution_id,');
    expect(seedSql).not.toContain('name=excluded.name, institution=excluded.institution');
    expect(institutionIds.size).toBeGreaterThan(0);
    expertInstitutionIds.forEach((institutionId) => {
      expect(institutionIds.has(institutionId)).toBe(true);
    });
  });

  it('matches expected seed counts and project lead references', () => {
    const seedSql = readFileSync(seedPath, 'utf-8');
    const expertBlock = getInsertBlock(seedSql, 'experts');
    const projectBlock = getInsertBlock(seedSql, 'projects');
    const expertIds = new Set(getIdsFromBlock(expertBlock));
    const projectIds = getIdsFromBlock(projectBlock);
    const projectRows = projectBlock.split('\n').filter((line) => line.trim().startsWith("('"));

    const csProjectRows = projectRows.filter((line) => line.includes(', true,'));
    const leadExpertIds = projectRows.map((row) => {
      const columns = row.match(/'(?:[^']|'')*'|NULL|true|false|[-]?\d+(?:\.\d+)?/g) ?? [];
      return columns[12]?.split("'").join('');
    }).filter((id): id is string => Boolean(id));

    expect(expertIds.size).toBe(30);
    expect(projectIds).toHaveLength(39);
    expect(csProjectRows).toHaveLength(10);
    expect(leadExpertIds).toHaveLength(39);
    leadExpertIds.forEach((leadExpertId) => {
      expect(expertIds.has(leadExpertId)).toBe(true);
    });
  });

  it('keeps local portrait files one-to-one with seeded expert IDs', () => {
    const seedSql = readFileSync(seedPath, 'utf-8');
    const expertValuesSql = getInsertBlock(seedSql, 'experts');
    const expertIds = new Set([...expertValuesSql.matchAll(/\('([0-9a-f-]{36})'/g)].map((match) => match[1]));
    const portraitFiles = readdirSync(portraitDir).filter((file) => /\.(jpg|png|webp)$/.test(file));

    portraitFiles.forEach((file) => {
      const expertId = file.replace(/\.(jpg|png|webp)$/, '');
      expect(expertIds.has(expertId)).toBe(true);
    });

    const hashes = portraitFiles.map((file) =>
      createHash('sha1').update(readFileSync(resolve(portraitDir, file))).digest('hex')
    );
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it('keeps public database access read-only except volunteer signup inserts', () => {
    const schemaSql = readFileSync(schemaPath, 'utf-8');

    expect(schemaSql).toContain('grant select on public.categories to anon, authenticated');
    expect(schemaSql).toContain('grant select on public.institutions to anon, authenticated');
    expect(schemaSql).toContain('grant select on public.app_projects to anon, authenticated');
    expect(schemaSql).toContain('grant select on public.app_experts to anon, authenticated');
    expect(schemaSql).toContain('grant insert on public.volunteer_subscriptions to anon, authenticated');
    expect(schemaSql).toContain('grant insert on public.volunteer_subscription_categories to anon, authenticated');
    expect(schemaSql).not.toMatch(/grant\s+(update|delete)\s+on\s+public\./i);
    expect(schemaSql).not.toMatch(/grant\s+insert\s+on\s+public\.(projects|experts|institutions|categories)\s+to\s+anon/i);
  });
});
