import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { MapDrawingWrapper } from '@/components/map/MapDrawingWrapper';
import { useAppStore } from '@/store/appStore';

const projectSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  status: z.enum(['active', 'past', 'planned']),
  field: z.string().min(1, 'Field is required'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  location: z.string().min(1, 'Location is required'),
  yearRange: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY'),
  areaCoords: z.array(z.tuple([z.number(), z.number()])).min(3, 'Polygon needs ≥3 points').optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
}

export const AddProjectModal = ({ isOpen, onClose, onSubmit }: AddProjectModalProps) => {
  const draftPolygon = useAppStore(s => s.draftPolygon);
  const setDraftPolygon = useAppStore(s => s.setDraftPolygon);

  const { 
    control, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      status: 'planned',
      field: '',
      description: '',
      location: '',
      yearRange: `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
    },
  });

  useEffect(() => {
    if (draftPolygon) setValue('areaCoords', draftPolygon);
  }, [draftPolygon, setValue]);

  const handleClose = () => {
    setDraftPolygon(null);
    onClose();
  };

  const handleSubmitForm = async (data: ProjectFormData) => {
    try {
      await onSubmit({ ...data, areaCoords: draftPolygon || data.areaCoords });
      setDraftPolygon(null);
      onClose();
    } catch (err: any) {
      console.error('Form submission failed:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Project" size="lg">
      {/* ✅ Added noValidate to prevent jsdom native validation from blocking submission */}
      <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4" noValidate>
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
                  errors.name ? 'border-red-500' : 'border-gray-300'
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
                <select {...field} id="add-project-status" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500">
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
                <input {...field} id="add-project-field" data-testid="add-project-field-input" list="field-options" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" />
              )}
            />
            <datalist id="field-options">
              <option value="Biodiversity" />
              <option value="Hydrology" />
              <option value="Wildlife" />
              <option value="Climate" />
            </datalist>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="add-project-description" className="block text-sm font-medium mb-1">Description *</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea {...field} id="add-project-description" rows={4} className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
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
                <input {...field} id="add-project-location" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" />
              )}
            />
          </div>
          <div>
            <label htmlFor="add-project-year" className="block text-sm font-medium mb-1">Year Range *</label>
            <Controller
              name="yearRange"
              control={control}
              render={({ field }) => (
                <input {...field} id="add-project-year" placeholder="2024-2028" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" />
              )}
            />
            {errors.yearRange && <p className="text-xs text-red-600 mt-1">{errors.yearRange.message}</p>}
          </div>
        </div>

        {/* Map Picker + Drawing */}
        <div>
          <label className="block text-sm font-medium mb-1">Project Area (Optional)</label>
          <div className="h-64 border border-gray-300 rounded overflow-hidden">
            <MapDrawingWrapper 
              onPolygonCreated={(coords) => setValue('areaCoords', coords)} 
              areaCoords={undefined} 
            />
          </div>
          <p className="text-xs text-text-muted mt-1">
            Use the polygon tool to draw the project area
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={handleClose} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            data-testid="add-project-submit"
            className="px-4 py-2 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Add Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProjectModal;
