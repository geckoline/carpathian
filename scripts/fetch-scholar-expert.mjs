#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const loadDotEnv = () => {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...parts] = trimmed.split('=');
    const value = parts.join('=').replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
};

const getArg = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const readAuthorInput = () => getArg('--url') ?? getArg('--author-id') ?? process.argv[2];

const getFirstEnv = (names) => {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return { name, value };
  }
  return null;
};

const extractAuthorId = (input) => {
  if (!input) return null;
  try {
    const parsed = new URL(input);
    if (!parsed.hostname.includes('scholar.google')) return null;
    return parsed.searchParams.get('user');
  } catch {
    return /^[A-Za-z0-9_-]+$/.test(input) ? input : null;
  }
};

const asNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const digits = value.replace(/\D/g, '');
    return digits ? Number(digits) : undefined;
  }
  return undefined;
};

const metricFromTable = (table, names) => {
  if (!Array.isArray(table)) return undefined;
  for (const row of table) {
    if (!row || typeof row !== 'object') continue;
    for (const [key, value] of Object.entries(row)) {
      if (!names.some((name) => key.toLowerCase().includes(name))) continue;
      const parsed = asNumber(value?.all);
      if (parsed !== undefined) return parsed;
    }
  }
  return undefined;
};

const isEmail = (value) =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const fallbackThumbnail = (authorId) =>
  `https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=${encodeURIComponent(authorId)}`;

const normalizeInterest = (interest) => {
  if (typeof interest === 'string') return interest;
  return typeof interest?.title === 'string' ? interest.title : undefined;
};

const makeBioDraft = ({ name, affiliation, interests, articles }) => {
  const interestText = interests.length > 0 ? interests.slice(0, 4).join(', ') : 'their research field';
  const articleTitles = articles.slice(0, 2).map((article) => article.title).filter(Boolean);
  const articleText = articleTitles.length > 0
    ? ` Representative publications include ${articleTitles.map((title) => `"${title}"`).join(' and ')}.`
    : '';

  return `${name} is affiliated with ${affiliation || 'an academic institution'} and works on ${interestText}.${articleText}`;
};

const normalizeProfile = (authorId, data) => {
  const author = data.author ?? {};
  const articles = Array.isArray(data.articles) ? data.articles : [];
  const interests = Array.isArray(author.interests)
    ? author.interests.map(normalizeInterest).filter(Boolean)
    : [];
  const citedByTable = data.cited_by?.table;
  const citedBy = asNumber(author.cited_by?.value) ?? metricFromTable(citedByTable, ['citation']);
  const hIndex = asNumber(author.h_index?.value) ?? metricFromTable(citedByTable, ['h_index', 'h-index', 'indice_h']);
  const i10Index = asNumber(author.i10_index?.value) ?? metricFromTable(citedByTable, ['i10_index', 'i10-index', 'indice_i10']);
  const verifiedEmailText = typeof author.email === 'string' ? author.email : undefined;
  const realEmail = isEmail(verifiedEmailText) ? verifiedEmailText.trim() : undefined;
  const profilePicture = author.thumbnail ?? fallbackThumbnail(authorId);
  const name = author.name ?? '';
  const institution = typeof author.affiliations === 'string'
    ? author.affiliations
    : author.affiliations?.value ?? '';

  return {
    authorId,
    googleScholar: `https://scholar.google.com/citations?user=${authorId}&hl=en`,
    name,
    institution,
    bio: makeBioDraft({ name, affiliation: institution, interests, articles }),
    expertise: interests,
    publications: articles.length,
    projects: 0,
    mail: realEmail ?? '',
    verifiedEmailText: verifiedEmailText ?? '',
    profilePicture,
    metrics: {
      citedBy,
      hIndex,
      i10Index,
    },
    articles: articles.map((article) => ({
      title: article.title,
      link: article.link,
      citationId: article.citation_id,
      authors: article.authors,
      publication: article.publication,
      year: article.year,
      citedBy: asNumber(article.cited_by?.value),
    })),
    coAuthors: Array.isArray(data.co_authors) ? data.co_authors : [],
    publicAccess: data.public_access,
    notes: {
      projects: 'App projects are derived from local project-expert links; Scholar cannot provide this count.',
      mail: realEmail ? 'Real email parsed.' : 'Scholar usually exposes only verified-email text, not a mailbox.',
      publications: 'Publication count is the number of articles returned by this SerpAPI page.',
    },
  };
};

const main = async () => {
  loadDotEnv();

  const input = readAuthorInput();
  const authorId = extractAuthorId(input);
  if (!authorId) {
    console.error('Usage: npm run fetch:scholar -- <scholar-url-or-author-id>');
    console.error('Example: npm run fetch:scholar -- https://scholar.google.com/citations?user=ajbnR9EAAAAJ&hl=en');
    process.exit(1);
  }

  const key = getFirstEnv([
    'SERPAPI_KEY',
    'SERPAPI_API_KEY',
    'GOOGLE_SCHOLAR_SERPAPI_KEY',
    'VITE_SERPAPI_KEY',
  ]);
  if (!key) {
    console.error('Missing a SerpAPI key in the environment.');
    console.error('Supported names: SERPAPI_KEY, SERPAPI_API_KEY, GOOGLE_SCHOLAR_SERPAPI_KEY, VITE_SERPAPI_KEY.');
    console.error(`Author id was extracted successfully: ${authorId}`);
    console.error(`Profile picture fallback: ${fallbackThumbnail(authorId)}`);
    process.exit(2);
  }

  const maxArticles = Number(getArg('--num') ?? 100);
  const timeoutMs = Number(getArg('--timeout-ms') ?? process.env.SERPAPI_TIMEOUT_MS ?? process.env.VITE_SERPAPI_TIMEOUT_MS ?? 10000);
  const url = new URL('https://serpapi.com/search');
  url.searchParams.set('engine', 'google_scholar_author');
  url.searchParams.set('author_id', authorId);
  url.searchParams.set('hl', 'en');
  url.searchParams.set('num', String(Math.min(Math.max(maxArticles, 1), 100)));
  url.searchParams.set('api_key', key.value);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 10000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    console.error(JSON.stringify({
      ok: false,
      status: response.status,
      authorId,
      keySource: key.name,
      error: data.error ?? response.statusText,
      profilePictureFallback: fallbackThumbnail(authorId),
    }, null, 2));
    process.exit(3);
  }

  console.log(JSON.stringify({
    ok: true,
    keySource: key.name,
    ...normalizeProfile(authorId, data),
  }, null, 2));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
