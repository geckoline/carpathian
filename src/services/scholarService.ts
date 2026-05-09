import { z } from 'zod';

export const ScholarProfileSchema = z.object({
  scholarId: z.string().min(1, 'Scholar ID is required'),
  name: z.string().min(1),
  affiliation: z.string().optional(),
  citedBy: z.number().int().min(0).optional(),
  hIndex: z.number().int().min(0).optional(),
  i10Index: z.number().int().min(0).optional(),
  publications: z.array(z.object({
    title: z.string(),
    year: z.number().int().optional(),
    citedBy: z.number().int().optional(),
  })).optional(),
});

export type ScholarProfile = z.infer<typeof ScholarProfileSchema>;

const MOCK_SCHOLAR_DATA: Record<string, ScholarProfile> = {
  'abc123': {
    scholarId: 'abc123',
    name: 'Dr. Elena Popescu',
    affiliation: 'University of Bucharest',
    citedBy: 1247,
    hIndex: 18,
    i10Index: 32,
  },
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const scholarService = {
  async getProfile(scholarId: string): Promise<ScholarProfile | null> {
    await delay(300);
    const profile = MOCK_SCHOLAR_DATA[scholarId];
    return profile ? ScholarProfileSchema.parse(profile) : null;
  },

  extractScholarId(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('scholar.google')) return null;
      const match = parsed.search.match(/user=([A-Za-z0-9_-]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  },

  buildProfileUrl(scholarId: string): string {
    return `https://scholar.google.com/citations?user=${scholarId}`;
  },

  isValidScholarUrl(url: string): boolean {
    return this.extractScholarId(url) !== null;
  },
};
