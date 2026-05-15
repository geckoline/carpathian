import { z } from 'zod';

const SerpApiResponseSchema = z.object({
  author: z.object({
    name: z.string(),
    affiliations: z.object({ value: z.string() }).optional(),
    cited_by: z.object({ value: z.number() }).optional(),
    h_index: z.object({ value: z.number() }).optional(),
    i10_index: z.object({ value: z.number() }).optional(),
  }),
});

export type ScholarProfile = {
  scholarId: string;
  name: string;
  affiliation?: string;
  citedBy?: number;
  hIndex?: number;
  i10Index?: number;
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
    const apiKey = import.meta.env.VITE_SERPAPI_KEY as string | undefined;
    if (!apiKey) return null;

    try {
      const url = new URL('https://serpapi.com/search');
      url.searchParams.set('engine', 'google_scholar_author');
      url.searchParams.set('author_id', scholarId);
      url.searchParams.set('api_key', apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) return null;

      const data = SerpApiResponseSchema.parse(await response.json());
      return {
        scholarId,
        name: data.author.name,
        affiliation: data.author.affiliations?.value,
        citedBy: data.author.cited_by?.value,
        hIndex: data.author.h_index?.value,
        i10Index: data.author.i10_index?.value,
      };
    } catch {
      return null;
    }
  },
};
