import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serpapiService } from '@/services/serpapiService';

describe('serpapiService', () => {
  describe('extractScholarId', () => {
    it('extracts scholar ID from standard URL', () => {
      const id = serpapiService.extractScholarId('https://scholar.google.com/citations?user=abc123');
      expect(id).toBe('abc123');
    });

    it('extracts scholar ID with additional params', () => {
      const id = serpapiService.extractScholarId('https://scholar.google.com/citations?user=abc123&hl=en');
      expect(id).toBe('abc123');
    });

    it('returns null for non-google-scholar URL', () => {
      const id = serpapiService.extractScholarId('https://example.com');
      expect(id).toBeNull();
    });

    it('returns null when no user param present', () => {
      const id = serpapiService.extractScholarId('https://scholar.google.com/citations?hl=en');
      expect(id).toBeNull();
    });

    it('returns null for invalid URL string', () => {
      const id = serpapiService.extractScholarId('not-a-url');
      expect(id).toBeNull();
    });

    it('returns null for empty string', () => {
      const id = serpapiService.extractScholarId('');
      expect(id).toBeNull();
    });
  });

  describe('isValidScholarUrl', () => {
    it('validates correct Google Scholar URL', () => {
      expect(serpapiService.isValidScholarUrl('https://scholar.google.com/citations?user=abc123')).toBe(true);
    });

    it('rejects non-scholar URL', () => {
      expect(serpapiService.isValidScholarUrl('https://example.com')).toBe(false);
    });

    it('rejects malformed URL', () => {
      expect(serpapiService.isValidScholarUrl('not-a-url')).toBe(false);
    });
  });

  describe('getProfile', () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch');

    beforeEach(() => {
      mockFetch.mockReset();
      vi.stubEnv('VITE_SERPAPI_KEY', 'test-key');
    });

    it('returns profile data on successful API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          author: {
            name: 'Dr. Jane Smith',
            affiliations: { value: 'University of Bucharest' },
            cited_by: { value: 1247 },
            h_index: { value: 18 },
            i10_index: { value: 32 },
          },
        }),
      } as Response);

      const profile = await serpapiService.getProfile('abc123');
      expect(profile).not.toBeNull();
      expect(profile?.name).toBe('Dr. Jane Smith');
      expect(profile?.affiliation).toBe('University of Bucharest');
      expect(profile?.citedBy).toBe(1247);
      expect(profile?.hIndex).toBe(18);
      expect(profile?.i10Index).toBe(32);
    });

    it('returns null when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      const profile = await serpapiService.getProfile('abc123');
      expect(profile).toBeNull();
    });

    it('returns null when API call fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const profile = await serpapiService.getProfile('abc123');
      expect(profile).toBeNull();
    });

    it('handles missing SerpAPI key gracefully', async () => {
      vi.stubEnv('VITE_SERPAPI_KEY', '');
      const profile = await serpapiService.getProfile('abc123');
      expect(profile).toBeNull();
    });

    it('returns null with anonymous fields when author data is partial', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          author: {
            name: 'Dr. Jane Smith',
          },
        }),
      } as Response);

      const profile = await serpapiService.getProfile('abc123');
      expect(profile).not.toBeNull();
      expect(profile?.name).toBe('Dr. Jane Smith');
      expect(profile?.affiliation).toBeUndefined();
      expect(profile?.citedBy).toBeUndefined();
    });
  });

  describe('buildProfileUrl', () => {
    it('builds correct Google Scholar profile URL', () => {
      expect(serpapiService.buildProfileUrl('abc123')).toBe(
        'https://scholar.google.com/citations?user=abc123'
      );
    });
  });
});
