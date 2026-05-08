// src/types/expert.ts
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
  email: z.string().email().optional(),
  linkedin: z.string().url().optional(),
  scopus: z.string().url().optional(),
  avatarUrl: z.string().url().optional(),
});

export type ExpertData = z.infer<typeof ExpertSchema>;