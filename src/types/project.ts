import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  status: z.enum(['active', 'past', 'planned']),
  field: z.string().min(1),
  description: z.string().min(10).max(2000),
  location: z.string().min(1),
  yearRange: z.string().regex(/^\d{4}-\d{4}$/),
  leadExpertId: z.string().uuid().optional(),
  leadExpertName: z.string().optional(),
  website: z.string().url().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  area: z.string().optional(),
  country: z.string().optional(),
  contact: z.string().optional(),
  isCitizenScience: z.boolean().optional(),
});

export type ProjectData = z.infer<typeof ProjectSchema>;
