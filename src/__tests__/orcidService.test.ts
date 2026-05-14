import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orcidService } from '@/services/orcidService';

describe('orcidService', () => {
  describe('extractOrcidId', () => {
    it('extracts ORCID ID from standard URL', () => {
      const id = orcidService.extractOrcidId('https://orcid.org/0000-0002-1825-0097');
      expect(id).toBe('0000-0002-1825-0097');
    });

    it('extracts ORCID ID from URL with trailing slash', () => {
      const id = orcidService.extractOrcidId('https://orcid.org/0000-0002-1825-0097/');
      expect(id).toBe('0000-0002-1825-0097');
    });

    it('returns null for non-orcid URL', () => {
      const id = orcidService.extractOrcidId('https://example.com');
      expect(id).toBeNull();
    });

    it('returns null for invalid URL string', () => {
      const id = orcidService.extractOrcidId('not-a-url');
      expect(id).toBeNull();
    });

    it('returns null for empty string', () => {
      const id = orcidService.extractOrcidId('');
      expect(id).toBeNull();
    });
  });

  describe('isValidOrcidUrl', () => {
    it('validates correct ORCID URL', () => {
      expect(orcidService.isValidOrcidUrl('https://orcid.org/0000-0002-1825-0097')).toBe(true);
    });

    it('rejects non-orcid URL', () => {
      expect(orcidService.isValidOrcidUrl('https://example.com')).toBe(false);
    });

    it('rejects malformed URL', () => {
      expect(orcidService.isValidOrcidUrl('not-a-url')).toBe(false);
    });
  });

  describe('getProfile', () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch');

    beforeEach(() => {
      mockFetch.mockReset();
    });

    it('returns profile data on successful API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: {
            'given-names': { value: 'Jane' },
            'family-name': { value: 'Smith' },
          },
          biography: { content: 'Expert in biodiversity' },
          'keywords': { keyword: [{ content: 'biodiversity' }, { content: 'forests' }] },
          country: { value: 'RO' },
        }),
      } as Response);

      const profile = await orcidService.getProfile('0000-0002-1825-0097');
      expect(profile).not.toBeNull();
      expect(profile?.name).toBe('Jane Smith');
      expect(profile?.biography).toBe('Expert in biodiversity');
      expect(profile?.keywords).toEqual(['biodiversity', 'forests']);
      expect(profile?.country).toBe('RO');
    });

    it('returns null when API returns 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const profile = await orcidService.getProfile('0000-0002-1825-0097');
      expect(profile).toBeNull();
    });

    it('returns null when API call fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const profile = await orcidService.getProfile('0000-0002-1825-0097');
      expect(profile).toBeNull();
    });

    it('handles missing optional fields gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: {
            'given-names': { value: 'Jane' },
            'family-name': { value: 'Smith' },
          },
        }),
      } as Response);

      const profile = await orcidService.getProfile('0000-0002-1825-0097');
      expect(profile).not.toBeNull();
      expect(profile?.name).toBe('Jane Smith');
      expect(profile?.biography).toBeUndefined();
      expect(profile?.keywords).toBeUndefined();
    });
  });
});
