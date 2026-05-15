import { z } from 'zod';

const OrcidResponseSchema = z.object({
  name: z.object({
    'given-names': z.object({ value: z.string() }),
    'family-name': z.object({ value: z.string() }),
  }),
  biography: z.object({ content: z.string() }).optional(),
  'keywords': z.object({ keyword: z.array(z.object({ content: z.string() })) }).optional(),
  country: z.object({ value: z.string() }).optional(),
});

export type OrcidProfile = {
  orcidId: string;
  name: string;
  biography?: string;
  keywords?: string[];
  country?: string;
};

const ORCID_API_BASE = 'https://pub.orcid.org/v3.0';

export const orcidService = {
  extractOrcidId(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.endsWith('orcid.org')) return null;
      const match = parsed.pathname.match(/^\/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])\/?$/);
      return match ? match[1]! : null;
    } catch {
      return null;
    }
  },

  isValidOrcidUrl(url: string): boolean {
    return this.extractOrcidId(url) !== null;
  },

  async getProfile(orcidId: string): Promise<OrcidProfile | null> {
    try {
      const response = await fetch(
        `${ORCID_API_BASE}/${orcidId}/record`,
        { headers: { Accept: 'application/json' } }
      );
      if (!response.ok) return null;

      const data = OrcidResponseSchema.parse(await response.json());
      return {
        orcidId,
        name: `${data.name['given-names'].value} ${data.name['family-name'].value}`,
        biography: data.biography?.content,
        keywords: data.keywords?.keyword.map(k => k.content),
        country: data.country?.value,
      };
    } catch {
      return null;
    }
  },
};
