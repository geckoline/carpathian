export type ScholarProfile = {
  scholarId: string;
  name: string;
  affiliation?: string;
  email?: string;
  verifiedEmailText?: string;
  thumbnail?: string;
  biography?: string;
  citedBy?: number;
  hIndex?: number;
  i10Index?: number;
  keywords?: string[];
  articles?: ScholarArticle[];
  coAuthors?: ScholarCoAuthor[];
  citationGraph?: ScholarCitationGraphPoint[];
  publicAccess?: {
    available?: number;
    notAvailable?: number;
    link?: string;
  };
  raw?: Record<string, unknown>;
};

export type ScholarArticle = {
  title: string;
  link?: string;
  citationId?: string;
  authors?: string;
  publication?: string;
  year?: string;
  citedBy?: number;
};

export type ScholarCoAuthor = {
  name: string;
  authorId?: string;
  affiliation?: string;
  email?: string;
  thumbnail?: string;
  link?: string;
};

export type ScholarCitationGraphPoint = {
  year: number;
  citations: number;
};

const getNested = (value: unknown, path: string[]): unknown => {
  let current = value;
  for (const key of path) {
    if (typeof current !== 'object' || current === null || !(key in current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
};

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const digits = value.replace(/\D/g, '');
    if (!digits) return undefined;
    const parsed = Number(digits);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const findMetricValue = (table: unknown, metricNames: string[]) => {
  if (!Array.isArray(table)) return undefined;

  for (const row of table) {
    if (typeof row !== 'object' || row === null) continue;
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = key.toLowerCase();
      if (!metricNames.some((metric) => normalizedKey.includes(metric))) continue;
      const all = getNested(value, ['all']);
      const parsed = asNumber(all);
      if (parsed !== undefined) return parsed;
    }
  }

  return undefined;
};

const parseArticles = (articles: unknown): ScholarArticle[] | undefined => {
  if (!Array.isArray(articles)) return undefined;

  const parsed = articles
    .map((article): ScholarArticle | null => {
      const title = asString(getNested(article, ['title']));
      if (!title) return null;
      return {
        title,
        link: asString(getNested(article, ['link'])),
        citationId: asString(getNested(article, ['citation_id'])),
        authors: asString(getNested(article, ['authors'])),
        publication: asString(getNested(article, ['publication'])),
        year: asString(getNested(article, ['year'])),
        citedBy: asNumber(getNested(article, ['cited_by', 'value'])),
      };
    })
    .filter((article): article is ScholarArticle => Boolean(article));

  return parsed.length > 0 ? parsed : undefined;
};

const parseCoAuthors = (coAuthors: unknown): ScholarCoAuthor[] | undefined => {
  if (!Array.isArray(coAuthors)) return undefined;

  const parsed = coAuthors
    .map((coAuthor): ScholarCoAuthor | null => {
      const name = asString(getNested(coAuthor, ['name']));
      if (!name) return null;
      return {
        name,
        authorId: asString(getNested(coAuthor, ['author_id'])),
        affiliation: asString(getNested(coAuthor, ['affiliations'])),
        email: asString(getNested(coAuthor, ['email'])),
        thumbnail: asString(getNested(coAuthor, ['thumbnail'])),
        link: asString(getNested(coAuthor, ['link'])),
      };
    })
    .filter((coAuthor): coAuthor is ScholarCoAuthor => Boolean(coAuthor));

  return parsed.length > 0 ? parsed : undefined;
};

const parseCitationGraph = (graph: unknown): ScholarCitationGraphPoint[] | undefined => {
  if (!Array.isArray(graph)) return undefined;

  const parsed = graph
    .map((point): ScholarCitationGraphPoint | null => {
      const year = asNumber(getNested(point, ['year']));
      const citations = asNumber(getNested(point, ['citations']));
      return year !== undefined && citations !== undefined ? { year, citations } : null;
    })
    .filter((point): point is ScholarCitationGraphPoint => Boolean(point));

  return parsed.length > 0 ? parsed : undefined;
};

const parseSerpApiProfile = (scholarId: string, payload: unknown): ScholarProfile | null => {
  const author = getNested(payload, ['author']);
  if (typeof author !== 'object' || author === null) return null;

  const name = asString(getNested(author, ['name']));
  if (!name) return null;
  const affiliation = asString(getNested(author, ['affiliations', 'value'])) ?? asString(getNested(author, ['affiliations']));
  const articles = parseArticles(getNested(payload, ['articles']));

  const interests = getNested(author, ['interests']);
  const keywords = Array.isArray(interests)
    ? interests
        .map((interest) => asString(getNested(interest, ['title'])) ?? asString(interest))
        .filter((interest): interest is string => Boolean(interest))
    : undefined;

  const verifiedEmailText = asString(getNested(author, ['email']));
  const interestText = keywords?.slice(0, 5).join(', ');
  const articleText = articles?.slice(0, 2).map((article) => article.title).filter(Boolean);
  const biography = [
    `${name} is affiliated with ${affiliation ?? 'an academic institution'}.`,
    interestText ? `Research interests include ${interestText}.` : undefined,
    articleText?.length ? `Representative publications include ${articleText.map((title) => `"${title}"`).join(' and ')}.` : undefined,
  ].filter(Boolean).join(' ');

  const profile: ScholarProfile = {
    scholarId,
    name,
    affiliation,
    email: verifiedEmailText?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? verifiedEmailText : undefined,
    verifiedEmailText,
    thumbnail: asString(getNested(author, ['thumbnail'])) ?? `https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=${encodeURIComponent(scholarId)}`,
    biography,
    citedBy: asNumber(getNested(author, ['cited_by', 'value']))
      ?? findMetricValue(getNested(payload, ['cited_by', 'table']), ['citation']),
    hIndex: asNumber(getNested(author, ['h_index', 'value']))
      ?? findMetricValue(getNested(payload, ['cited_by', 'table']), ['h_index', 'indice_h', 'h-index']),
    i10Index: asNumber(getNested(author, ['i10_index', 'value']))
      ?? findMetricValue(getNested(payload, ['cited_by', 'table']), ['i10_index', 'indice_i10', 'i10-index']),
    keywords,
    articles,
    coAuthors: parseCoAuthors(getNested(payload, ['co_authors'])),
    citationGraph: parseCitationGraph(getNested(payload, ['cited_by', 'graph'])),
    publicAccess: typeof getNested(payload, ['public_access']) === 'object' && getNested(payload, ['public_access']) !== null
      ? {
          available: asNumber(getNested(payload, ['public_access', 'available'])),
          notAvailable: asNumber(getNested(payload, ['public_access', 'not_available'])),
          link: asString(getNested(payload, ['public_access', 'link'])),
        }
      : undefined,
    raw: typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : undefined,
  };

  return profile;
};

const cleanScholarText = (value: string | null | undefined) =>
  value
    ?.replace(/[\u200e\u200f\u202a-\u202e]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const parseScholarHtmlProfile = (scholarId: string, html: string): ScholarProfile | null => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const name = cleanScholarText(doc.querySelector('#gsc_prf_in')?.textContent)
    ?? cleanScholarText(doc.querySelector('meta[property="og:title"]')?.getAttribute('content'));
  if (!name) return null;

  const affiliation = cleanScholarText(doc.querySelector('.gsc_prf_il')?.textContent);
  const thumbnail = cleanScholarText(doc.querySelector('meta[property="og:image"]')?.getAttribute('content'));
  const keywords = Array.from(doc.querySelectorAll('.gsc_prf_inta'))
    .map((item) => cleanScholarText(item.textContent))
    .filter((keyword): keyword is string => Boolean(keyword));
  const stats = Array.from(doc.querySelectorAll('#gsc_rsb_st .gsc_rsb_std'))
    .map((item) => asNumber(item.textContent));

  return {
    scholarId,
    name,
    affiliation,
    thumbnail,
    citedBy: stats[0],
    hIndex: stats[2],
    i10Index: stats[4],
    keywords: keywords.length > 0 ? keywords : undefined,
  };
};

const getEnvString = (key: string): string | undefined => {
  const value = import.meta.env[key] as string | undefined;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const getFirstEnvString = (keys: string[]) => {
  for (const key of keys) {
    const value = getEnvString(key);
    if (value) return value;
  }
  return undefined;
};

const getTimeoutMs = () => {
  const value = Number(getEnvString('VITE_SERPAPI_TIMEOUT_MS') ?? 10000);
  return Number.isFinite(value) && value > 0 ? value : 10000;
};

const isScholarHtmlFallbackEnabled = () =>
  getEnvString('VITE_ENABLE_SCHOLAR_HTML_FALLBACK') === 'true';

const fetchWithTimeout = (url: string) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), getTimeoutMs());
  return fetch(url, { signal: controller.signal }).finally(() => window.clearTimeout(timeout));
};

const shouldUseProxy = () =>
  getEnvString('VITE_SERPAPI_USE_PROXY') !== 'false';

const buildSerpApiUrl = (params: Record<string, string>) => {
  const proxyUrl = getEnvString('VITE_SERPAPI_PROXY_URL') ?? '/api/serpapi/search';
  const useProxy = shouldUseProxy();
  const url = useProxy
    ? new URL(proxyUrl, window.location.origin)
    : new URL('https://serpapi.com/search');

  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  if (!useProxy) {
    const apiKey = getFirstEnvString([
      'VITE_SERPAPI_KEY',
      'VITE_SERPAPI_API_KEY',
      'VITE_GOOGLE_SCHOLAR_SERPAPI_KEY',
    ]);
    if (!apiKey) return null;
    url.searchParams.set('api_key', apiKey);
  }

  return url;
};

export const serpapiService = {
  extractScholarId(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('scholar.google')) return null;
      const match = parsed.search.match(/user=([A-Za-z0-9_-]+)/);
      return match ? match[1]! : null;
    } catch {
      return null;
    }
  },

  isValidScholarUrl(url: string): boolean {
    return this.extractScholarId(url) !== null;
  },

  buildProfileUrl(scholarId: string): string {
    return `https://scholar.google.com/citations?user=${scholarId}`;
  },

  async getProfile(scholarId: string): Promise<ScholarProfile | null> {
    try {
      const url = buildSerpApiUrl({
        engine: 'google_scholar_author',
        author_id: scholarId,
        hl: 'en',
        num: '100',
      });
      if (!url) return null;

      const response = await fetchWithTimeout(url.toString());
      if (response.ok) {
        const profile = parseSerpApiProfile(scholarId, await response.json());
        if (profile) return profile;
      }
    } catch {
      return null;
    }

    if (!isScholarHtmlFallbackEnabled()) return null;

    try {
      const profileUrl = `${this.buildProfileUrl(scholarId)}&hl=en`;
      const url = new URL('https://serpapi.com/search');
      url.protocol = 'https:';
      url.hostname = 'api.allorigins.win';
      url.pathname = '/raw';
      url.search = '';
      url.searchParams.set('url', profileUrl);

      const response = await fetchWithTimeout(url.toString());
      if (!response.ok) return null;

      return parseScholarHtmlProfile(scholarId, await response.text());
    } catch {
      return null;
    }
  },
};
