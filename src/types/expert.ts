import { z } from 'zod';

export const ExpertSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  institution: z.string().min(1),
  country: z.string().min(1),
  degree: z.string().min(1),
  bio: z.string().min(20).max(2000),
  expertise: z.array(z.string().min(1)),
  publications: z.number().int().min(0).optional(),
  projects: z.number().int().min(0).optional(),
  email: z.string().email('Valid email is required'),
  linkedin: z.string().url().optional(),
  scopus: z.string().url().optional(),
  orcid: z.string().url().optional(),
  googleScholar: z.string().url().optional(),
  avatarUrl: z.string().url().optional(),
  isCitizenScience: z.boolean().optional(),
}).refine(
  (data) => [data.linkedin, data.scopus, data.orcid, data.googleScholar].some(Boolean),
  { message: 'At least one profile link (LinkedIn, Scopus, ORCID, or Google Scholar) is required.' }
);

export type ExpertData = z.infer<typeof ExpertSchema>;
