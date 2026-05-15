import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormModal } from '@/components/modals/FormModal';
import { ImportConflictDialog, type ConflictField } from '@/components/modals/ImportConflictDialog';
import { ExpertFormSchema, type ExpertFormData, type ExpertData } from '@/types/expert';
import { importValidator } from '@/services/importValidator';

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

export const AddExpertModal = ({ isOpen, onClose, onSubmit, isOnline = true }: AddExpertModalProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validatingField, setValidatingField] = useState<string | null>(null);
  const [conflictFields, setConflictFields] = useState<ConflictField[] | null>(null);

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
      country: '',
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
      publications: 0,
    },
  });

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
        setSubmitError(result?.error ?? 'Could not fetch profile');
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
      if ('country' in profile && profile.country) checkConflict('country', 'Country', profile.country);

      if (conflicts.length > 0) {
        setConflictFields(conflicts);
      } else {
        applyImportedData(profile);
      }
    } catch {
      setSubmitError('Failed to validate profile URL');
    } finally {
      setValidatingField(null);
    }
  }, [getValues]);

  const applyImportedData = (
    profile: Record<string, unknown>,
  ) => {
    if (profile.name) setValue('name', profile.name as string, { shouldValidate: true });
    if ('affiliation' in profile && profile.affiliation) setValue('institution', profile.affiliation as string, { shouldValidate: true });
    if ('biography' in profile && profile.biography) setValue('bio', profile.biography as string, { shouldValidate: true });
    if ('country' in profile && profile.country) setValue('country', profile.country as string, { shouldValidate: true });
    if ('keywords' in profile && profile.keywords) {
      const matched = (profile.keywords as string[])
        .map(k => k.toLowerCase().replace(/\s+/g, '-'))
        .filter(k => expertiseOptions.includes(k));
      if (matched.length > 0) setValue('expertise', matched, { shouldValidate: true });
    }
    if ('citedBy' in profile || 'hIndex' in profile || 'i10Index' in profile) {
      if ('citedBy' in profile && typeof profile.citedBy === 'number') setValue('publications', profile.citedBy);
    }
  };

  const handleConflictConfirm = useCallback((selectedKeys: string[]) => {
    const profile = conflictFields?.reduce<Record<string, string>>((acc, f) => {
      acc[f.key] = f.imported;
      return acc;
    }, {});
    if (!profile) return;

    selectedKeys.forEach(key => {
      if (profile[key]) {
        setValue(key as keyof ExpertFormData, profile[key], { shouldValidate: true });
      }
    });

    setConflictFields(null);
  }, [conflictFields, setValue]);

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
              <label htmlFor="expert-country" className="block text-sm font-medium mb-1">Country *</label>
              <Controller name="country" control={control} render={({ field }) => (
                <input {...field} id="expert-country" className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.country ? 'border-red-500' : 'border-[var(--color-soft-border)]'}`} aria-invalid={!!errors.country} />
              )} />
              {errors.country && <p className="text-xs text-red-600 mt-1">{errors.country.message}</p>}
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
                    className="px-3 py-2 text-sm border border-[var(--color-soft-border)] rounded hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
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
                    className="px-3 py-2 text-sm border border-[var(--color-soft-border)] rounded hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
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
