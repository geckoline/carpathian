import { orcidService, type OrcidProfile } from './orcidService';
import { serpapiService, type ScholarProfile } from './serpapiService';

export type ValidationResult = {
  source: 'orcid' | 'google_scholar';
  valid: boolean;
  profile?: OrcidProfile | ScholarProfile;
  error?: string;
};

export const importValidator = {
  async validateOrcidUrl(url: string): Promise<ValidationResult> {
    const orcidId = orcidService.extractOrcidId(url);
    if (!orcidId) {
      return { source: 'orcid', valid: false, error: 'Invalid ORCID URL format' };
    }

    const profile = await orcidService.getProfile(orcidId);
    if (!profile) {
      return { source: 'orcid', valid: false, error: 'Could not fetch ORCID profile' };
    }

    return { source: 'orcid', valid: true, profile };
  },

  async validateScholarUrl(url: string): Promise<ValidationResult> {
    const scholarId = serpapiService.extractScholarId(url);
    if (!scholarId) {
      return { source: 'google_scholar', valid: false, error: 'Invalid Google Scholar URL format' };
    }

    const profile = await serpapiService.getProfile(scholarId);
    if (!profile) {
      return { source: 'google_scholar', valid: false, error: 'Could not fetch Google Scholar profile' };
    }

    return { source: 'google_scholar', valid: true, profile };
  },

  async validateBoth(urls: { orcid?: string; googleScholar?: string }): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    if (urls.orcid) {
      results.push(await this.validateOrcidUrl(urls.orcid));
    }
    if (urls.googleScholar) {
      results.push(await this.validateScholarUrl(urls.googleScholar));
    }

    return results;
  },
};
