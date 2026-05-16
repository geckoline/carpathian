import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormModal } from '@/components/modals/FormModal';
import { ImportConflictDialog, type ConflictField } from '@/components/modals/ImportConflictDialog';
import { ExpertFormSchema, type ExpertFormData, type ExpertData } from '@/types/expert';
import { importValidator } from '@/services/importValidator';
import { COUNTRY_OPTIONS } from '@/utils/countries';
import { normalizeCategoryId, type CategoryId } from '@/utils/categories';

interface AddExpertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpertFormData) => Promise<ExpertData | void>;
  isOnline?: boolean;
}

const expertiseOptions = [
  'biodiversity', 'spatial-planning', 'water', 'agriculture',
  'forests', 'tourism', 'cultural-heritage', 'industry-infrastructure',
  'awareness-education', 'climate-change',
];

const isEmailAddress = (value: unknown): value is string =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const AddExpertModal = ({ isOpen, onClose, onSubmit, isOnline = true }: AddExpertModalProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validatingField, setValidatingField] = useState<string | null>(null);
  const [conflictFields, setConflictFields] = useState<ConflictField[] | null>(null);
  const [pendingConflictProfile, setPendingConflictProfile] = useState<Record<string, unknown> | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
    watch,
  } = useForm<ExpertFormData>({
    resolver: zodResolver(ExpertFormSchema),
    defaultValues: {
      name: '',
      institution: '',
      countries: [],
      degree: '',
      headline: '',
      expertiseSubtitle: '',
      bio: '',
      expertise: [],
      email: '',
      linkedin: '',
      scopus: '',
      orcid: '',
      googleScholar: '',
      profileImageUrl: '',
      publications: 0,
      projects: 0,
      importMetadata: undefined,
    },
  });

  const deriveScholarThumbnailUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      const scholarId = parsed.searchParams.get('user');
      return scholarId
        ? `https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=${encodeURIComponent(scholarId)}`
        : undefined;
    } catch {
      return undefined;
    }
  };

  const handleFetchProfile = useCallback(async (source: 'orcid' | 'google_scholar') => {
    const url = source === 'orcid' ? getValues('orcid') : getValues('googleScholar');
    if (!url) return;

    setValidatingField(source);
    setSubmitError(null);

    try {
      const results = await importValidator.validateBoth(
        source === 'orcid' ? { orcid: url } : { googleScholar: url }
      );
      const result = results[0];
      if (!result?.valid || !result.profile) {
        if (source === 'google_scholar') {
          const thumbnail = deriveScholarThumbnailUrl(url);
          if (thumbnail) {
            setValue('profileImageUrl', thumbnail, { shouldValidate: true });
          }
        }
        setSubmitError(
          result?.error
            ?? 'Could not fetch profile. Check the SerpAPI key or upload a profile picture manually.'
        );
        return;
      }

      const profile = result.profile;
      const conflicts: ConflictField[] = [];
      const currentValues = getValues();

      const checkConflict = (key: keyof ExpertFormData, label: string, importedValue: string) => {
        if (!importedValue) return;
        const current = currentValues[key];
        if (typeof current === 'string' && current && current !== importedValue) {
          conflicts.push({ key, label, current, imported: importedValue });
        }
      };

      if ('name' in profile && profile.name) checkConflict('name', 'Name', profile.name);
      if ('affiliation' in profile && profile.affiliation) checkConflict('institution', 'Institution', profile.affiliation);
      if ('biography' in profile && profile.biography) checkConflict('bio', 'Bio', profile.biography);
      if ('country' in profile && profile.country) {
        const imported = profile.country as string;
        const match = COUNTRY_OPTIONS.find(c => c.name.toLowerCase() === imported.toLowerCase());
        if (match) {
          const current = currentValues.countries;
          if (current && current.length > 0 && !current.includes(match.code)) {
            conflicts.push({ key: 'countries', label: 'Country', current: current.join(', '), imported: match.code });
          }
        }
      }

      const conflictKeys = new Set(conflicts.map((conflict) => conflict.key as keyof ExpertFormData));
      applyImportedData(profile, conflictKeys);

      if (conflicts.length > 0) {
        setPendingConflictProfile(profile);
        setConflictFields(conflicts);
      }
    } catch {
      setSubmitError('Failed to validate profile URL');
    } finally {
      setValidatingField(null);
    }
  }, [getValues, setValue]);

  const handleProfileImageUpload = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSubmitError('Choose a JPG, PNG, or WebP profile image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        setValue('profileImageUrl', result, { shouldValidate: true });
        setSubmitError(null);
      }
    };
    reader.onerror = () => setSubmitError('Could not read the selected profile image.');
    reader.readAsDataURL(file);
  }, [setValue]);

  const applyImportedData = (
    profile: Record<string, unknown>,
    skippedKeys = new Set<keyof ExpertFormData>(),
  ) => {
    const keywords = Array.isArray(profile.keywords)
      ? profile.keywords.filter((keyword): keyword is string => typeof keyword === 'string' && keyword.trim().length > 0)
      : [];
    const affiliation = typeof profile.affiliation === 'string' ? profile.affiliation : '';
    const thumbnail = typeof profile.thumbnail === 'string' && profile.thumbnail
      ? profile.thumbnail
      : typeof profile.scholarId === 'string'
        ? deriveScholarThumbnailUrl(`https://scholar.google.com/citations?user=${profile.scholarId}`)
        : undefined;

    if (!skippedKeys.has('name') && profile.name) setValue('name', profile.name as string, { shouldValidate: true });
    if (!skippedKeys.has('institution') && affiliation) setValue('institution', affiliation, { shouldValidate: true });
    if (!skippedKeys.has('email') && 'email' in profile && isEmailAddress(profile.email)) setValue('email', profile.email, { shouldValidate: true });
    if (!skippedKeys.has('profileImageUrl') && thumbnail) setValue('profileImageUrl', thumbnail, { shouldValidate: true });
    if (!skippedKeys.has('bio') && 'biography' in profile && profile.biography) setValue('bio', profile.biography as string, { shouldValidate: true });
    if (!skippedKeys.has('headline') && keywords[0]) {
      const headline = `${keywords[0]} expert${affiliation ? ` at ${affiliation}` : ''}`.slice(0, 200);
      if (headline.length >= 10) setValue('headline', headline, { shouldValidate: true });
    }
    if (!skippedKeys.has('expertiseSubtitle') && keywords.length > 0) {
      setValue('expertiseSubtitle', keywords.slice(0, 6).join(' • ').slice(0, 200), { shouldValidate: true });
    }
    if ('country' in profile && profile.country) {
      const code = COUNTRY_OPTIONS.find(c => c.name.toLowerCase() === (profile.country as string).toLowerCase())?.code;
      if (code && !skippedKeys.has('countries')) setValue('countries', [code], { shouldValidate: true });
    }
    if (!skippedKeys.has('expertise') && keywords.length > 0) {
      const matched = Array.from(new Set(
        keywords
          .map((keyword) => mapScholarKeywordToExpertise(keyword))
          .filter((keyword): keyword is CategoryId => Boolean(keyword))
      ));
      if (matched.length > 0) setValue('expertise', matched, { shouldValidate: true });
    }
    if (!skippedKeys.has('publications') && 'articles' in profile && Array.isArray(profile.articles)) {
      setValue('publications', profile.articles.length, { shouldValidate: true });
    } else if (!skippedKeys.has('publications') && 'citedBy' in profile && typeof profile.citedBy === 'number') {
      setValue('publications', profile.citedBy, { shouldValidate: true });
    }
    if ('scholarId' in profile) {
      setValue('importMetadata', {
        source: 'google_scholar',
        importedAt: new Date().toISOString(),
        profileImageUrl: thumbnail,
        scholar: profile,
      });
    }
  };

  const mapScholarKeywordToExpertise = (keyword: string): CategoryId | undefined => {
    const normalized = keyword.toLowerCase();
    const direct = normalizeCategoryId(keyword);
    if (direct) return direct;
    if (/(bio|ecolog|species|habitat|conservation|genom|gene|computational)/.test(normalized)) return 'biodiversity';
    if (/(water|hydro|river|lake|wetland)/.test(normalized)) return 'water';
    if (/(forest|tree|wood)/.test(normalized)) return 'forests';
    if (/(farm|crop|agricultur|soil)/.test(normalized)) return 'agriculture';
    if (/(climate|carbon|weather)/.test(normalized)) return 'climate-change';
    if (/(touris|recreation)/.test(normalized)) return 'tourism';
    if (/(heritage|culture|tradition|archaeolog|history)/.test(normalized)) return 'cultural-heritage';
    if (/(spatial|planning|land use|mapping|gis|remote sensing)/.test(normalized)) return 'spatial-planning';
    if (/(infrastructure|industry|transport|energy)/.test(normalized)) return 'industry-infrastructure';
    if (/(education|awareness|learning|citizen science)/.test(normalized)) return 'awareness-education';
    return 'biodiversity';
  };

  const handleConflictConfirm = useCallback((selectedKeys: string[]) => {
    const profile = conflictFields?.reduce<Record<string, string>>((acc, f) => {
      acc[f.key] = f.imported;
      return acc;
    }, {});
    if (!profile) return;

    selectedKeys.forEach(key => {
      const importedValue = profile[key];
      if (importedValue) {
        setValue(key as keyof ExpertFormData, importedValue, { shouldValidate: true });
      }
    });

    if (pendingConflictProfile) {
      applyImportedData(pendingConflictProfile, new Set(selectedKeys as Array<keyof ExpertFormData>));
    }

    setConflictFields(null);
    setPendingConflictProfile(null);
  }, [conflictFields, pendingConflictProfile, setValue]);

  const handleSubmitForm = async (data: ExpertFormData) => {
    try {
      setSubmitError(null);
      await onSubmit(data);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Expert could not be saved. Please try again.');
    }
  };

  const handleClose = () => {
    setSubmitError(null);
    setConflictFields(null);
    setPendingConflictProfile(null);
    onClose();
  };

  return (
    <>
      <FormModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Add New Expert"
        size="lg"
        submitLabel="Add Expert"
        isSubmitting={isSubmitting}
        isOnline={isOnline}
        submitError={submitError}
        onSubmit={handleSubmit(handleSubmitForm)}
        initialFocus="#expert-name"
      >
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expert-name" className="block text-sm font-medium mb-1">Name *</label>
              <Controller name="name" control={control} render={({ field }) => (
                <input {...field} id="expert-name" className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.name ? 'border-red-500' : 'border-[var(--color-soft-border)]'}`} aria-invalid={!!errors.name} />
              )} />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="expert-institution" className="block text-sm font-medium mb-1">Institution *</label>
              <Controller name="institution" control={control} render={({ field }) => (
                <input {...field} id="expert-institution" className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.institution ? 'border-red-500' : 'border-[var(--color-soft-border)]'}`} aria-invalid={!!errors.institution} />
              )} />
              {errors.institution && <p className="text-xs text-red-600 mt-1">{errors.institution.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expert-countries" className="block text-sm font-medium mb-1">Countries *</label>
              <Controller name="countries" control={control} render={({ field }) => (
                <select
                  id="expert-countries"
                  multiple
                  value={field.value}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                    field.onChange(selected);
                  }}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] ${errors.countries ? 'border-red-500' : 'border-[var(--color-soft-border)]'}`}
                  aria-invalid={!!errors.countries}
                >
                  {COUNTRY_OPTIONS.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              )} />
              {errors.countries && <p className="text-xs text-red-600 mt-1">{errors.countries.message}</p>}
            </div>
            <div>
              <label htmlFor="expert-degree" className="block text-sm font-medium mb-1">Degree</label>
              <Controller name="degree" control={control} render={({ field }) => (
                <input {...field} id="expert-degree" className="w-full px-3 py-2 border border-[var(--color-soft-border)] rounded focus:outline-none focus:ring-2 focus:ring-primary-500" />
              )} />
            </div>
          </div>

          <div>
            <label htmlFor="expert-headline" className="block text-sm font-medium mb-1">Headline</label>
            <Controller name="headline" control={control} render={({ field }) => (
              <input {...field} id="expert-headline" className="w-full px-3 py-2 border border-[var(--color-soft-border)] rounded focus:outline-none focus:ring-2 focus:ring-primary-500" />
            )} />
            {errors.headline && <p className="text-xs text-red-600 mt-1">{errors.headline.message}</p>}
          </div>

          <div>
            <label htmlFor="expert-bio" className="block text-sm font-medium mb-1">Bio *</label>
            <Controller name="bio" control={control} render={({ field }) => (
              <textarea {...field} id="expert-bio" rows={3} className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.bio ? 'border-red-500' : 'border-[var(--color-soft-border)]'}`} aria-invalid={!!errors.bio} />
            )} />
            {errors.bio && <p className="text-xs text-red-600 mt-1">{errors.bio.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expert-publications" className="block text-sm font-medium mb-1">Publications</label>
              <Controller name="publications" control={control} render={({ field }) => (
                <input
                  {...field}
                  id="expert-publications"
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border border-[var(--color-soft-border)] rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              )} />
              {errors.publications && <p className="text-xs text-red-600 mt-1">{errors.publications.message}</p>}
            </div>
            <div>
              <label htmlFor="expert-projects" className="block text-sm font-medium mb-1">Projects</label>
              <Controller name="projects" control={control} render={({ field }) => (
                <input
                  {...field}
                  id="expert-projects"
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border border-[var(--color-soft-border)] rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              )} />
              {errors.projects && <p className="text-xs text-red-600 mt-1">{errors.projects.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expertise *</label>
            <Controller name="expertise" control={control} render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {expertiseOptions.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-surface-muted">
                    <input
                      type="checkbox"
                      checked={field.value.includes(opt)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...field.value, opt]
                          : field.value.filter((v) => v !== opt);
                        field.onChange(next);
                      }}
                    />
                    {opt.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </label>
                ))}
              </div>
            )} />
            {errors.expertise && <p className="text-xs text-red-600 mt-1">{errors.expertise.message}</p>}
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-primary-700 mb-3">Contact & Verification</h3>
            <p className="text-xs text-text-muted mb-3">Email is required. At least one of Google Scholar or ORCID is required.</p>

            <div className="mb-3">
              <label htmlFor="expert-profile-image" className="block text-sm font-medium mb-1">Profile picture</label>
              <div className="flex items-center gap-3">
                {watch('profileImageUrl') ? (
                  <img
                    src={watch('profileImageUrl')}
                    alt="Profile preview"
                    className="h-16 w-16 rounded-full border border-[var(--color-soft-border)] object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full border border-dashed border-[var(--color-soft-border)] bg-surface-muted" aria-hidden="true" />
                )}
                <div className="flex-1 space-y-2">
                  <Controller name="profileImageUrl" control={control} render={({ field }) => (
                    <input
                      {...field}
                      id="expert-profile-image-url"
                      type="url"
                      aria-label="Profile picture URL"
                      placeholder="https://..."
                      className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.profileImageUrl ? 'border-red-500' : 'border-[var(--color-soft-border)]'}`}
                      aria-invalid={!!errors.profileImageUrl}
                    />
                  )} />
                  <input
                    id="expert-profile-image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => handleProfileImageUpload(event.currentTarget.files?.[0])}
                    className="block w-full text-sm text-text-muted file:mr-3 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700"
                  />
                </div>
              </div>
              {errors.profileImageUrl && <p className="text-xs text-red-600 mt-1">{errors.profileImageUrl.message}</p>}
            </div>

            <div className="mb-3">
              <label htmlFor="expert-email" className="block text-sm font-medium mb-1">Email *</label>
              <Controller name="email" control={control} render={({ field }) => (
                <input {...field} id="expert-email" type="email" className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.email ? 'border-red-500' : 'border-[var(--color-soft-border)]'}`} aria-invalid={!!errors.email} />
              )} />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="expert-google-scholar" className="block text-sm font-medium mb-1">Google Scholar URL *</label>
                <div className="flex gap-2">
                  <Controller name="googleScholar" control={control} render={({ field }) => (
                    <input {...field} id="expert-google-scholar" type="url" placeholder="https://scholar.google.com/citations?user=..." className={`flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.googleScholar ? 'border-red-500' : 'border-[var(--color-soft-border)]'}`} aria-invalid={!!errors.googleScholar} />
                  )} />
                  <button
                    type="button"
                    onClick={() => handleFetchProfile('google_scholar')}
                    disabled={!watch('googleScholar') || validatingField === 'google_scholar'}
                    className="px-3 py-2 text-sm border border-[var(--color-soft-border)] rounded-full hover:bg-[var(--color-panel-surface-soft)] disabled:opacity-50 whitespace-nowrap transition"
                  >
                    {validatingField === 'google_scholar' ? 'Fetching...' : 'Fetch Profile'}
                  </button>
                </div>
                {errors.googleScholar && <p className="text-xs text-red-600 mt-1">{errors.googleScholar.message}</p>}
              </div>

              <div>
                <label htmlFor="expert-orcid" className="block text-sm font-medium mb-1">ORCID URL *</label>
                <div className="flex gap-2">
                  <Controller name="orcid" control={control} render={({ field }) => (
                    <input {...field} id="expert-orcid" type="url" placeholder="https://orcid.org/0000-0002-..." className={`flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.orcid ? 'border-red-500' : 'border-[var(--color-soft-border)]'}`} aria-invalid={!!errors.orcid} />
                  )} />
                  <button
                    type="button"
                    onClick={() => handleFetchProfile('orcid')}
                    disabled={!watch('orcid') || validatingField === 'orcid'}
                    className="px-3 py-2 text-sm border border-[var(--color-soft-border)] rounded-full hover:bg-[var(--color-panel-surface-soft)] disabled:opacity-50 whitespace-nowrap transition"
                  >
                    {validatingField === 'orcid' ? 'Fetching...' : 'Fetch Profile'}
                  </button>
                </div>
                {errors.orcid && <p className="text-xs text-red-600 mt-1">{errors.orcid.message}</p>}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-primary-700 mb-3">Additional Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expert-linkedin" className="block text-sm font-medium mb-1">LinkedIn</label>
                <Controller name="linkedin" control={control} render={({ field }) => (
                  <input {...field} id="expert-linkedin" type="url" className="w-full px-3 py-2 border border-[var(--color-soft-border)] rounded focus:outline-none focus:ring-2 focus:ring-primary-500" />
                )} />
              </div>
              <div>
                <label htmlFor="expert-scopus" className="block text-sm font-medium mb-1">Scopus</label>
                <Controller name="scopus" control={control} render={({ field }) => (
                  <input {...field} id="expert-scopus" type="url" className="w-full px-3 py-2 border border-[var(--color-soft-border)] rounded focus:outline-none focus:ring-2 focus:ring-primary-500" />
                )} />
              </div>
            </div>
          </div>

      </FormModal>

      <ImportConflictDialog
        isOpen={conflictFields !== null}
        onClose={() => setConflictFields(null)}
        fields={conflictFields ?? []}
        onConfirm={handleConflictConfirm}
      />
    </>
  );
};

export default AddExpertModal;
