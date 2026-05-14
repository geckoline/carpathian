import { describe, it, expect } from 'vitest';
import { ExpertFormSchema } from '@/types/expert';

describe('ExpertFormSchema', () => {
  const validBase = {
    name: 'Dr. Jane Smith',
    institution: 'University of Bucharest',
    country: 'Romania',
    bio: 'Expert in Carpathian biodiversity with 15 years of field research experience.',
    expertise: ['biodiversity', 'forests'],
    email: 'jane.smith@unibuc.ro',
  };

  it('accepts valid data with ORCID URL', () => {
    const result = ExpertFormSchema.safeParse({
      ...validBase,
      orcid: 'https://orcid.org/0000-0002-1825-0097',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid data with Google Scholar URL', () => {
    const result = ExpertFormSchema.safeParse({
      ...validBase,
      googleScholar: 'https://scholar.google.com/citations?user=abc123',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid data with both social URLs', () => {
    const result = ExpertFormSchema.safeParse({
      ...validBase,
      orcid: 'https://orcid.org/0000-0002-1825-0097',
      googleScholar: 'https://scholar.google.com/citations?user=abc123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when email is missing', () => {
    const result = ExpertFormSchema.safeParse({
      name: 'Dr. Jane Smith',
      institution: 'University of Bucharest',
      country: 'Romania',
      bio: 'Expert in Carpathian biodiversity.',
      expertise: ['biodiversity'],
      orcid: 'https://orcid.org/0000-0002-1825-0097',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailErrors = result.error.issues.filter(i => i.path.includes('email'));
      expect(emailErrors.length).toBeGreaterThan(0);
    }
  });

  it('rejects when email is empty string', () => {
    const result = ExpertFormSchema.safeParse({
      ...validBase,
      email: '',
      orcid: 'https://orcid.org/0000-0002-1825-0097',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = ExpertFormSchema.safeParse({
      ...validBase,
      email: 'not-an-email',
      orcid: 'https://orcid.org/0000-0002-1825-0097',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when both ORCID and Google Scholar are missing', () => {
    const result = ExpertFormSchema.safeParse(validBase);
    expect(result.success).toBe(false);
    if (!result.success) {
      const hasRefineError = result.error.issues.some(
        i => i.message.includes('Google Scholar') || i.message.includes('ORCID')
      );
      expect(hasRefineError).toBe(true);
    }
  });

  it('rejects when both ORCID and Google Scholar are empty strings', () => {
    const result = ExpertFormSchema.safeParse({
      ...validBase,
      orcid: '',
      googleScholar: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid ORCID URL format', () => {
    const result = ExpertFormSchema.safeParse({
      ...validBase,
      orcid: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid Google Scholar URL format', () => {
    const result = ExpertFormSchema.safeParse({
      ...validBase,
      googleScholar: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when name is empty', () => {
    const result = ExpertFormSchema.safeParse({
      ...validBase,
      name: '',
      orcid: 'https://orcid.org/0000-0002-1825-0097',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when bio is too short', () => {
    const result = ExpertFormSchema.safeParse({
      ...validBase,
      bio: 'Short',
      orcid: 'https://orcid.org/0000-0002-1825-0097',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty expertise array', () => {
    const result = ExpertFormSchema.safeParse({
      ...validBase,
      expertise: [],
      orcid: 'https://orcid.org/0000-0002-1825-0097',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields when not provided', () => {
    const result = ExpertFormSchema.safeParse({
      ...validBase,
      orcid: 'https://orcid.org/0000-0002-1825-0097',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid linkedin URL as optional field', () => {
    const result = ExpertFormSchema.safeParse({
      ...validBase,
      orcid: 'https://orcid.org/0000-0002-1825-0097',
      linkedin: 'https://www.linkedin.com/in/jane-smith',
    });
    expect(result.success).toBe(true);
  });
});
