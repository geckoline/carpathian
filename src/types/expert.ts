import { z } from 'zod';

const ProfileImageUrlSchema = z.string().refine((value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return value.startsWith('/profile-pictures/') && !value.includes('..');
  }
}, 'Expected an absolute URL or a local /profile-pictures/ asset path');

export const ExpertSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  institution: z.string().min(1),
  country: z.string().min(1),
  degree: z.string().optional(),
  headline: z.string().min(10).max(200).optional(),
  expertiseSubtitle: z.string().min(3).max(200).optional(),
  bio: z.string().min(1).max(2000),
  expertise: z.array(z.string().min(1)),
  publications: z.number().int().min(0).optional(),
  projects: z.number().int().min(0).optional(),
  email: z.string().email().optional(),
  linkedin: z.string().url().optional(),
  scopus: z.string().url().optional(),
  orcid: z.string().url().optional(),
  googleScholar: z.string().url().optional(),
  avatarUrl: ProfileImageUrlSchema.optional(),
  isCitizenScience: z.boolean().optional(),
});

export type ExpertData = z.infer<typeof ExpertSchema>;
