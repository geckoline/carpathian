import { z } from 'zod';
import { serpapiService, type ScholarProfile } from './serpapiService';

export type { ScholarProfile } from './serpapiService';

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

export const scholarService = {
  async getProfile(scholarId: string): Promise<ScholarProfile | null> {
    return serpapiService.getProfile(scholarId);
  },

  extractScholarId(url: string): string | null {
    return serpapiService.extractScholarId(url);
  },

  buildProfileUrl(scholarId: string): string {
    return serpapiService.buildProfileUrl(scholarId);
  },

  isValidScholarUrl(url: string): boolean {
    return serpapiService.isValidScholarUrl(url);
  },
};
