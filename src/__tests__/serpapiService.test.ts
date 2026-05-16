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

    it('extracts scholar ID from the provided real profile URL', () => {
      const id = serpapiService.extractScholarId('https://scholar.google.com/citations?user=RmW1avAAAAAJ&hl=en');
      expect(id).toBe('RmW1avAAAAAJ');
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
      vi.stubEnv('VITE_ENABLE_SCHOLAR_HTML_FALLBACK', 'false');
      vi.stubEnv('VITE_SERPAPI_TIMEOUT_MS', '10000');
    });

    it('returns profile data on successful API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          author: {
            name: 'Dr. Jane Smith',
            affiliations: 'University of Bucharest',
            email: 'Verified email at unibuc.ro',
            thumbnail: 'https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=abc123',
            interests: [{ title: 'Biodiversity' }, { title: 'Mountain Ecology' }],
          },
          articles: [{
            title: 'A mountain ecology paper',
            citation_id: 'abc123:citation',
            authors: 'J Smith',
            publication: 'Journal of Ecology, 2024',
            year: '2024',
            cited_by: { value: 12 },
          }],
          cited_by: {
            table: [
              { citations: { all: 1247, since_2021: 400 } },
              { h_index: { all: 18, since_2021: 10 } },
              { i10_index: { all: 32, since_2021: 14 } },
            ],
            graph: [{ year: 2024, citations: '33' }],
          },
          public_access: { available: 9, not_available: 1 },
          co_authors: [{
            name: 'Co Author',
            author_id: 'co123',
            affiliations: 'Institute',
            thumbnail: 'https://scholar.googleusercontent.com/citations?view_op=small_photo&user=co123',
          }],
        }),
      } as Response);

      const profile = await serpapiService.getProfile('abc123');
      expect(profile).not.toBeNull();
      expect(profile?.name).toBe('Dr. Jane Smith');
      expect(profile?.affiliation).toBe('University of Bucharest');
      expect(profile?.citedBy).toBe(1247);
      expect(profile?.hIndex).toBe(18);
      expect(profile?.i10Index).toBe(32);
      expect(profile?.email).toBeUndefined();
      expect(profile?.verifiedEmailText).toBe('Verified email at unibuc.ro');
      expect(profile?.thumbnail).toContain('medium_photo');
      expect(profile?.keywords).toEqual(['Biodiversity', 'Mountain Ecology']);
      expect(profile?.articles?.[0]).toEqual(expect.objectContaining({
        title: 'A mountain ecology paper',
        citationId: 'abc123:citation',
        citedBy: 12,
      }));
      expect(profile?.citationGraph).toEqual([{ year: 2024, citations: 33 }]);
      expect(profile?.publicAccess).toEqual({ available: 9, notAvailable: 1, link: undefined });
      expect(profile?.coAuthors?.[0]).toEqual(expect.objectContaining({
        name: 'Co Author',
        authorId: 'co123',
        thumbnail: expect.stringContaining('small_photo'),
      }));
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
      vi.stubEnv('VITE_SERPAPI_API_KEY', '');
      vi.stubEnv('VITE_GOOGLE_SCHOLAR_SERPAPI_KEY', '');
      vi.stubEnv('VITE_SERPAPI_USE_PROXY', 'false');
      const profile = await serpapiService.getProfile('abc123');
      expect(profile).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('falls back to public Scholar HTML only when explicitly enabled after SerpAPI misses', async () => {
      vi.stubEnv('VITE_ENABLE_SCHOLAR_HTML_FALLBACK', 'true');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'Unexpected response' }),
      } as Response);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <html>
            <head>
              <meta property="og:title" content="Henrik von Wehrden">
              <meta property="og:image" content="https://scholar.googleusercontent.com/citations?view_op=medium_photo&amp;user=RmW1avAAAAAJ&amp;citpid=2">
            </head>
            <body>
              <div id="gsc_prf_in">Henrik von Wehrden</div>
              <div class="gsc_prf_il">Professor for Normativity of Methods, Leuphana University</div>
              <a class="gsc_prf_inta gs_ibl">Methods</a>
              <a class="gsc_prf_inta gs_ibl">Sustainability Science</a>
              <table id="gsc_rsb_st">
                <tr><td class="gsc_rsb_std">20.412</td><td class="gsc_rsb_std">14,000</td></tr>
                <tr><td class="gsc_rsb_std">64</td><td class="gsc_rsb_std">49</td></tr>
                <tr><td class="gsc_rsb_std">147</td><td class="gsc_rsb_std">110</td></tr>
              </table>
            </body>
          </html>
        `,
      } as Response);

      const profile = await serpapiService.getProfile('RmW1avAAAAAJ');

      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.allorigins.win/raw?url=https%3A%2F%2Fscholar.google.com%2Fcitations%3Fuser%3DRmW1avAAAAAJ%26hl%3Den',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(profile).toEqual({
        scholarId: 'RmW1avAAAAAJ',
        name: 'Henrik von Wehrden',
        affiliation: 'Professor for Normativity of Methods, Leuphana University',
        thumbnail: 'https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=RmW1avAAAAAJ&citpid=2',
        citedBy: 20412,
        hIndex: 64,
        i10Index: 147,
        keywords: ['Methods', 'Sustainability Science'],
      });
    });

    it('returns null after unexpected SerpAPI shape when fallback is disabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'Unexpected response' }),
      } as Response);

      const profile = await serpapiService.getProfile('abc123');

      expect(profile).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(1);
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
