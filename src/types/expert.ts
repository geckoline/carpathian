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
  importMetadata: z.record(z.unknown()).optional(),
});

export type ExpertData = z.infer<typeof ExpertSchema>;

const SocialUrl = z.string().url('Must be a valid URL').optional().or(z.literal(''));

export const ExpertFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  institution: z.string().min(1, 'Institution is required'),
  country: z.string().min(1, 'Country is required'),
  degree: z.string().optional(),
  headline: z.string().min(10, 'Headline must be at least 10 characters').max(200).optional(),
  expertiseSubtitle: z.string().min(3).max(200).optional(),
  bio: z.string().min(20, 'Bio must be at least 20 characters').max(2000),
  expertise: z.array(z.string().min(1)).min(1, 'At least one expertise is required'),
  publications: z.coerce.number().int().min(0).optional(),
  email: z.string().email('Valid email is required'),
  linkedin: SocialUrl,
  scopus: SocialUrl,
  orcid: SocialUrl,
  googleScholar: SocialUrl,
}).superRefine((data, ctx) => {
  if (!data.orcid && !data.googleScholar) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['googleScholar'],
      message: 'At least one of Google Scholar URL or ORCID URL is required',
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['orcid'],
      message: 'At least one of Google Scholar URL or ORCID URL is required',
    });
  }
});

export type ExpertFormData = z.infer<typeof ExpertFormSchema>;
