import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  status: z.enum(['active', 'past', 'planned']),
  categoryId: z.string().optional(),
  field: z.string().min(1),
  description: z.string().min(10).max(2000),
  location: z.string().min(1),
  displayLocation: z.string().optional(),
  regionLabel: z.string().optional(),
  yearRange: z.string().regex(/^\d{4}-\d{4}$/),
  expertIds: z.array(z.string().uuid()),
  teamMembers: z.array(z.object({ id: z.string().uuid(), name: z.string().min(1) })),
  cardSummary: z.string().min(10).max(300).optional(),
  focusSummary: z.string().min(10).max(300).optional(),
  outputsSummary: z.string().min(10).max(300).optional(),
  website: z.string().url().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  area: z.string().optional(),
  countries: z.array(z.string().length(2)),
  contact: z.string().optional(),
  isCitizenScience: z.boolean().optional(),
});

export type ProjectData = z.infer<typeof ProjectSchema>;
