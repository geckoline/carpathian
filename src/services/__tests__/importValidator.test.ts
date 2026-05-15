import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importValidator } from '@/services/importValidator';
import { orcidService } from '@/services/orcidService';
import { serpapiService } from '@/services/serpapiService';

vi.mock('@/services/orcidService', () => ({
  orcidService: {
    extractOrcidId: vi.fn(),
    getProfile: vi.fn(),
    isValidOrcidUrl: vi.fn(),
  },
}));

vi.mock('@/services/serpapiService', () => ({
  serpapiService: {
    extractScholarId: vi.fn(),
    getProfile: vi.fn(),
    isValidScholarUrl: vi.fn(),
    buildProfileUrl: vi.fn(),
  },
}));

describe('importValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateOrcidUrl', () => {
    beforeEach(() => {
      vi.mocked(orcidService.extractOrcidId).mockReturnValue('0000-0002-1825-0097');
      vi.mocked(orcidService.getProfile).mockResolvedValue({
        orcidId: '0000-0002-1825-0097',
        name: 'Jane Smith',
      });
    });

    it('returns valid result for valid ORCID URL with existing profile', async () => {
      const result = await importValidator.validateOrcidUrl('https://orcid.org/0000-0002-1825-0097');
      expect(result.valid).toBe(true);
      expect(result.source).toBe('orcid');
      expect(result.profile?.name).toBe('Jane Smith');
    });

    it('returns invalid result when profile fetch fails', async () => {
      vi.mocked(orcidService.getProfile).mockResolvedValue(null);
      const result = await importValidator.validateOrcidUrl('https://orcid.org/0000-0002-1825-0097');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Could not fetch ORCID profile');
    });

    it('returns invalid result for non-orcid URL', async () => {
      vi.mocked(orcidService.extractOrcidId).mockReturnValue(null);
      const result = await importValidator.validateOrcidUrl('https://example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid ORCID URL format');
    });

    it('returns invalid result for malformed URL', async () => {
      vi.mocked(orcidService.extractOrcidId).mockReturnValue(null);
      const result = await importValidator.validateOrcidUrl('not-a-url');
      expect(result.valid).toBe(false);
    });

    it('returns invalid result for empty URL', async () => {
      vi.mocked(orcidService.extractOrcidId).mockReturnValue(null);
      const result = await importValidator.validateOrcidUrl('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateScholarUrl', () => {
    beforeEach(() => {
      vi.mocked(serpapiService.extractScholarId).mockReturnValue('abc123');
      vi.mocked(serpapiService.getProfile).mockResolvedValue({
        scholarId: 'abc123',
        name: 'Dr. Jane Smith',
        affiliation: 'University of Bucharest',
      });
    });

    it('returns valid result for valid Google Scholar URL', async () => {
      const result = await importValidator.validateScholarUrl(
        'https://scholar.google.com/citations?user=abc123'
      );
      expect(result.valid).toBe(true);
      expect(result.source).toBe('google_scholar');
      expect(result.profile?.name).toBe('Dr. Jane Smith');
    });

    it('returns invalid result when profile fetch fails', async () => {
      vi.mocked(serpapiService.getProfile).mockResolvedValue(null);
      const result = await importValidator.validateScholarUrl(
        'https://scholar.google.com/citations?user=abc123'
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Could not fetch Google Scholar profile');
    });

    it('returns invalid result for non-scholar URL', async () => {
      vi.mocked(serpapiService.extractScholarId).mockReturnValue(null);
      const result = await importValidator.validateScholarUrl('https://example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid Google Scholar URL format');
    });

    it('returns invalid result for malformed URL', async () => {
      vi.mocked(serpapiService.extractScholarId).mockReturnValue(null);
      const result = await importValidator.validateScholarUrl('not-a-url');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateBoth', () => {
    it('validates orcid when provided', async () => {
      vi.mocked(orcidService.extractOrcidId).mockReturnValue('0000-0002-1825-0097');
      vi.mocked(orcidService.getProfile).mockResolvedValue({
        orcidId: '0000-0002-1825-0097',
        name: 'Jane Smith',
      });
      const results = await importValidator.validateBoth({
        orcid: 'https://orcid.org/0000-0002-1825-0097',
      });
      expect(results).toHaveLength(1);
      expect(results[0]!.source).toBe('orcid');
      expect(results[0]!.valid).toBe(true);
    });

    it('validates scholar when provided', async () => {
      vi.mocked(serpapiService.extractScholarId).mockReturnValue('abc123');
      vi.mocked(serpapiService.getProfile).mockResolvedValue({
        scholarId: 'abc123',
        name: 'Dr. Jane Smith',
      });
      const results = await importValidator.validateBoth({
        googleScholar: 'https://scholar.google.com/citations?user=abc123',
      });
      expect(results).toHaveLength(1);
      expect(results[0]!.source).toBe('google_scholar');
      expect(results[0]!.valid).toBe(true);
    });

    it('validates both when both provided', async () => {
      vi.mocked(orcidService.extractOrcidId).mockReturnValue('0000-0002-1825-0097');
      vi.mocked(orcidService.getProfile).mockResolvedValue({
        orcidId: '0000-0002-1825-0097',
        name: 'Jane Smith',
      });
      vi.mocked(serpapiService.extractScholarId).mockReturnValue('abc123');
      vi.mocked(serpapiService.getProfile).mockResolvedValue({
        scholarId: 'abc123',
        name: 'Dr. Jane Smith',
      });
      const results = await importValidator.validateBoth({
        orcid: 'https://orcid.org/0000-0002-1825-0097',
        googleScholar: 'https://scholar.google.com/citations?user=abc123',
      });
      expect(results).toHaveLength(2);
      expect(results[0]!.valid).toBe(true);
      expect(results[1]!.valid).toBe(true);
    });

    it('returns empty array when neither provided', async () => {
      const results = await importValidator.validateBoth({});
      expect(results).toHaveLength(0);
    });
  });
});
