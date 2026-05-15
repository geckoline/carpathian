import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormModal } from '@/components/modals/FormModal';
import { MapDrawingWrapper } from '@/components/map/MapDrawingWrapper';
import { useAppStore } from '@/store/appStore';
import { getCategoryOptions } from '@/utils/categories';

const projectSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  status: z.enum(['active', 'past', 'planned']),
  field: z.string().min(1, 'Field is required'),
  leadExpertId: z.string().uuid('Choose a leading expert from the expert database'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  location: z.string().min(1, 'Location is required'),
  yearRange: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY'),
  areaCoords: z.array(z.tuple([z.number(), z.number()])).min(3, 'Polygon needs ≥3 points').optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

const categoryOptions = getCategoryOptions();

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  isOnline?: boolean;
}

export const AddProjectModal = ({ isOpen, onClose, onSubmit, isOnline = true }: AddProjectModalProps) => {
  const draftPolygon = useAppStore(s => s.draftPolygon);
  const setDraftPolygon = useAppStore(s => s.setDraftPolygon);
  const experts = useAppStore(s => s.data.experts);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { 
    control, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    setValue,
    watch,
    getValues,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      status: 'planned',
      field: 'biodiversity',
      leadExpertId: experts[0]?.id ?? '',
      description: '',
      location: '',
      yearRange: `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
    },
  });

  useEffect(() => {
    if (!getValues('leadExpertId') && experts[0]?.id) {
      setValue('leadExpertId', experts[0].id, { shouldValidate: true });
    }
  }, [experts, setValue, getValues]);

  const areaCoords = watch('areaCoords');

  const handlePolygonCreated = (coords: [number, number][]) => {
    setValue('areaCoords', coords, { shouldDirty: true, shouldValidate: true });
    setDraftPolygon(coords);
  };

  const handleClearPolygon = () => {
    setValue('areaCoords', undefined, { shouldDirty: true, shouldValidate: true });
    setDraftPolygon(null);
  };

  const handleClose = () => {
    setSubmitError(null);
    setDraftPolygon(null);
    onClose();
  };

  const handleSubmitForm = async (data: ProjectFormData) => {
    try {
      setSubmitError(null);
      await onSubmit({ ...data, areaCoords: draftPolygon || data.areaCoords });
      setDraftPolygon(null);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Project could not be saved. Please try again.');
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Project"
      size="lg"
      submitLabel="Add Project"
      isSubmitting={isSubmitting}
      isOnline={isOnline}
      submitError={submitError}
      onSubmit={handleSubmit(handleSubmitForm)}
      submitDisabled={experts.length === 0}
      submitTestId="add-project-submit"
    >
      {/* Name */}
        <div>
          <label htmlFor="add-project-name" className="block text-sm font-medium mb-1">Project Name *</label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                id="add-project-name"
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-500' : 'border-[var(--color-soft-border)]'
                }`}
                aria-invalid={!!errors.name}
              />
            )}
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        {/* Status + Field Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="add-project-status" className="block text-sm font-medium mb-1">Status *</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <select {...field} id="add-project-status" className="w-full px-3 py-2 border border-[var(--color-soft-border)] rounded focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="past">Past</option>
                </select>
              )}
            />
          </div>
          <div>
            <label htmlFor="add-project-field" className="block text-sm font-medium mb-1">Field *</label>
            <Controller
              name="field"
              control={control}
              render={({ field }) => (
                <select {...field} id="add-project-field" data-testid="add-project-field-input" className="w-full px-3 py-2 border border-[var(--color-soft-border)] rounded focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>

        <div>
          <label htmlFor="add-project-lead-expert" className="block text-sm font-medium mb-1">Leading Expert *</label>
          <Controller
            name="leadExpertId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="add-project-lead-expert"
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.leadExpertId ? 'border-red-500' : 'border-[var(--color-soft-border)]'
                }`}
                aria-invalid={!!errors.leadExpertId}
                disabled={experts.length === 0}
              >
                {experts.length === 0 ? (
                  <option value="">Add an expert before adding a project</option>
                ) : (
                  experts.map((expert) => (
                    <option key={expert.id} value={expert.id}>
                      {expert.name} · {expert.institution}
                    </option>
                  ))
                )}
              </select>
            )}
          />
          <p className="mt-1 text-xs text-text-muted">
            The leading expert must already exist as an expert card in the database.
          </p>
          {errors.leadExpertId && <p className="text-xs text-red-600 mt-1">{errors.leadExpertId.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="add-project-description" className="block text-sm font-medium mb-1">Description *</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea {...field} id="add-project-description" rows={4} className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.description ? 'border-red-500' : 'border-[var(--color-soft-border)]'
              }`} />
            )}
          />
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
        </div>

        {/* Location + Year Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="add-project-location" className="block text-sm font-medium mb-1">Location *</label>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <input {...field} id="add-project-location" className="w-full px-3 py-2 border border-[var(--color-soft-border)] rounded focus:outline-none focus:ring-2 focus:ring-primary-500" />
              )}
            />
          </div>
          <div>
            <label htmlFor="add-project-year" className="block text-sm font-medium mb-1">Year Range *</label>
            <Controller
              name="yearRange"
              control={control}
              render={({ field }) => (
                <input {...field} id="add-project-year" placeholder="2024-2028" className="w-full px-3 py-2 border border-[var(--color-soft-border)] rounded focus:outline-none focus:ring-2 focus:ring-primary-500" />
              )}
            />
            {errors.yearRange && <p className="text-xs text-red-600 mt-1">{errors.yearRange.message}</p>}
          </div>
        </div>

        {/* Map Picker + Drawing */}
        <div>
          <label className="block text-sm font-medium mb-1">Project Area (Optional)</label>
          <div className="h-64 border border-[var(--color-soft-border)] rounded overflow-hidden">
            <MapDrawingWrapper 
              onPolygonCreated={handlePolygonCreated}
              areaCoords={areaCoords}
            />
          </div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-xs text-text-muted">
              {areaCoords?.length ? `${areaCoords.length} area points selected` : 'Use the polygon tool to draw the project area'}
            </p>
            {areaCoords?.length ? (
              <button
                type="button"
                onClick={handleClearPolygon}
                className="text-xs font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
              >
                Clear project area
              </button>
            ) : null}
          </div>
          {errors.areaCoords && (
            <p className="text-xs text-red-600 mt-1" role="alert">{errors.areaCoords.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
        </div>
    </FormModal>
  );
};

export default AddProjectModal;
