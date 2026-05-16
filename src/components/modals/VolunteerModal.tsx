import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormModal } from '@/components/modals/FormModal';
import { VolunteerSubscriptionSchema, type VolunteerSubscriptionData } from '@/types/volunteer';
import { getCategoryOptions } from '@/utils/categories';

export type VolunteerFormData = VolunteerSubscriptionData;

interface VolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VolunteerFormData) => Promise<void>;
  isOnline?: boolean;
}

const categoryOptions = getCategoryOptions();
const allCategoryIds = categoryOptions.map((c) => c.id);

export const VolunteerModal = ({ isOpen, onClose, onSubmit, isOnline = true }: VolunteerModalProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VolunteerFormData>({
    resolver: zodResolver(VolunteerSubscriptionSchema),
    defaultValues: {
      fullName: '', email: '', city: '', country: '',
      zipCode: '', radiusKm: 50,
      categoryIds: [], note: '', consent: false,
    },
  });

  const handleSubmitForm = async (data: VolunteerFormData) => {
    try {
      setSubmitError(null);
      await onSubmit(data);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Volunteer subscription could not be saved.');
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Volunteer"
      submitLabel="Subscribe"
      isSubmitting={isSubmitting}
      isOnline={isOnline}
      submitError={submitError}
      onSubmit={handleSubmit(handleSubmitForm)}
      initialFocus="#vol-full-name"
    >
      <p className="text-sm text-text-muted">
        Subscribe once and we will match you with citizen science projects near your city when they need volunteers.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="vol-full-name" className="mb-1 block text-sm font-medium">Full name *</label>
          <Controller name="fullName" control={control} render={({ field }) => (
            <input {...field} id="vol-full-name" className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.fullName ? 'border-red-500' : 'border-[var(--color-soft-border)]'}`} aria-invalid={!!errors.fullName} />
          )} />
          {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="vol-email" className="mb-1 block text-sm font-medium">Email *</label>
          <Controller name="email" control={control} render={({ field }) => (
            <input {...field} id="vol-email" type="email" className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.email ? 'border-red-500' : 'border-[var(--color-soft-border)]'}`} aria-invalid={!!errors.email} />
          )} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="vol-city" className="mb-1 block text-sm font-medium">City *</label>
          <Controller name="city" control={control} render={({ field }) => (
            <input {...field} id="vol-city" className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.city ? 'border-red-500' : 'border-[var(--color-soft-border)]'}`} aria-invalid={!!errors.city} />
          )} />
          {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
        </div>
        <div>
          <label htmlFor="vol-country" className="mb-1 block text-sm font-medium">Country *</label>
          <Controller name="country" control={control} render={({ field }) => (
            <input {...field} id="vol-country" className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.country ? 'border-red-500' : 'border-[var(--color-soft-border)]'}`} aria-invalid={!!errors.country} />
          )} />
          {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>}
        </div>
        <div>
          <label htmlFor="vol-zip" className="mb-1 block text-sm font-medium">Zip Code</label>
          <Controller name="zipCode" control={control} render={({ field }) => (
            <input {...field} id="vol-zip" className="w-full rounded border border-[var(--color-soft-border)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          )} />
        </div>
      </div>

      <fieldset className="rounded-xl border border-[var(--color-panel-border)] p-3">
        <legend className="px-1 text-sm font-medium">Matching area *</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="vol-radius" className="mb-1 block text-xs font-medium text-text-muted">Radius in km</label>
            <Controller name="radiusKm" control={control} render={({ field }) => (
              <input {...field} id="vol-radius" type="number" min={1} max={500} className="w-full rounded border border-[var(--color-soft-border)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            )} />
          </div>
        </div>
        {errors.radiusKm && (
          <p className="mt-2 text-xs text-red-600" role="alert">{errors.radiusKm.message}</p>
        )}
      </fieldset>

      <fieldset className="rounded-xl border border-[var(--color-panel-border)] p-3">
        <legend className="px-1 text-sm font-medium">Interested Scientific Fields *</legend>
        <Controller name="categoryIds" control={control} render={({ field }) => {
          const allSelected = allCategoryIds.every((id) => field.value.includes(id));
          return (
            <div className="space-y-2">
              <label className="flex items-center gap-2 rounded-lg border border-primary-300 bg-primary-50 px-3 py-2 text-sm font-medium">
                <input type="checkbox" checked={allSelected}
                  onChange={() => {
                    field.onChange(allSelected ? [] : [...allCategoryIds]);
                  }}
                />
                All Scientific Fields
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {categoryOptions.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 rounded-lg border border-[var(--color-soft-border)] px-3 py-2 text-sm">
                    <input type="checkbox" checked={field.value.includes(category.id)}
                      onChange={(event) => {
                        const next = event.target.checked ? [...field.value, category.id] : field.value.filter((id) => id !== category.id);
                        field.onChange(next);
                      }}
                    />
                    {category.label}
                  </label>
                ))}
              </div>
            </div>
          );
        }} />
        {errors.categoryIds && <p className="mt-2 text-xs text-red-600">{errors.categoryIds.message}</p>}
      </fieldset>

      <div>
        <label htmlFor="vol-note" className="mb-1 block text-sm font-medium">Optional note</label>
        <Controller name="note" control={control} render={({ field }) => (
          <textarea {...field} id="vol-note" rows={3} placeholder="Availability, languages, or local knowledge you want project teams to know."
            className="w-full rounded border border-[var(--color-soft-border)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        )} />
      </div>

      <Controller name="consent" control={control} render={({ field }) => (
        <label className="flex items-start gap-3 rounded-xl bg-primary-50/70 px-3 py-3 text-sm">
          <input type="checkbox" checked={field.value} onChange={(event) => field.onChange(event.target.checked)} className="mt-1" />
          <span>I consent to storing my subscription details so project teams can contact me about nearby participatory projects.</span>
        </label>
      )} />
      {errors.consent && <p className="text-xs text-red-600">{errors.consent.message}</p>}
    </FormModal>
  );
};

export default VolunteerModal;
