import { z } from 'zod';

export const VolunteerSubscriptionSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(160),
  email: z.string().email('Valid email is required'),
  city: z.string().min(2, 'City is required').max(120),
  country: z.string().min(2, 'Country is required').max(120),
  zipCode: z.string().max(20).optional(),
  radiusKm: z.coerce.number().min(1, 'Radius must be at least 1 km').max(500, 'Radius must be 500 km or less'),
  categoryIds: z.array(z.string()).min(1, 'Choose at least one category'),
  note: z.string().max(1000).optional(),
  consent: z.boolean().refine(Boolean, 'Consent is required before subscribing'),
});

export type VolunteerSubscriptionData = z.infer<typeof VolunteerSubscriptionSchema>;
