import { z } from 'zod';

export const wizardSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  status: z.enum(['active', 'past', 'planned']),
  field: z.string().min(1, 'Scientific field is required'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  expertIds: z.array(z.string().uuid()).min(1, 'Select at least one expert'),
  location: z.string().min(1, 'Location is required'),
  areaCoords: z.array(z.tuple([z.number(), z.number()])).optional().refine(
    (val) => val === undefined || val.length === 1 || val.length >= 3,
    { message: 'Draw at least 3 points for a valid polygon area' }
  ),
  areaMode: z.enum(['simple', 'draw', 'import']),
  yearRange: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY'),
  countries: z.array(z.string().length(2)).min(1, 'Select at least one country'),
});

export type WizardFormData = z.infer<typeof wizardSchema>;

export const WIZARD_STEPS = [
  { label: 'Basics' },
  { label: 'Expert' },
  { label: 'Location' },
  { label: 'Details' },
  { label: 'Review' },
] as const;

export const STEP_FIELDS: Record<number, (keyof WizardFormData)[]> = {
  0: ['name', 'status', 'field', 'description'],
  1: ['expertIds'],
  2: ['location'],
  3: ['yearRange', 'countries'],
  4: [],
};

export const DRAFT_STORAGE_KEY = 'carpathian-add-project-draft';
