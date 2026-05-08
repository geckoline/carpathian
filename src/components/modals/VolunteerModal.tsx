import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';

const volunteerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  expertise: z.string().min(1, 'Expertise is required'),
  motivation: z.string().min(50, 'Please share at least 50 characters about your motivation'),
  projectId: z.string().uuid('Invalid project ID'),
  availability: z.enum(['full-time', 'part-time', 'occasional']),
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;

interface VolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSubmit: (data: VolunteerFormData) => Promise<void>;
}

export const VolunteerModal = ({ isOpen, onClose, projectId, onSubmit }: VolunteerModalProps) => {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: { projectId, availability: 'part-time' },
  });

  const onSubmitForm = async (data: VolunteerFormData) => {
    try {
      await onSubmit({ ...data, projectId });
      onClose();
    } catch (err) {
      // Error handled by parent
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Volunteer Application" size="md">
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
        <div>
          <label htmlFor="vol-name" className="block text-sm font-medium mb-1">Full Name *</label>
          <Controller name="name" control={control} render={({ field }) => (
            <input {...field} id="vol-name" className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
          )} />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="vol-email" className="block text-sm font-medium mb-1">Email *</label>
          <Controller name="email" control={control} render={({ field }) => (
            <input {...field} id="vol-email" type="email" className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
          )} />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="vol-expertise" className="block text-sm font-medium mb-1">Area of Expertise *</label>
          <Controller name="expertise" control={control} render={({ field }) => (
            <input {...field} id="vol-expertise" placeholder="e.g., GIS, Field Research" className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.expertise ? 'border-red-500' : 'border-gray-300'}`} />
          )} />
          {errors.expertise && <p className="text-xs text-red-600 mt-1">{errors.expertise.message}</p>}
        </div>

        <div>
          <label htmlFor="vol-motivation" className="block text-sm font-medium mb-1">Why do you want to volunteer? *</label>
          <Controller name="motivation" control={control} render={({ field }) => (
            <textarea {...field} id="vol-motivation" rows={4} className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.motivation ? 'border-red-500' : 'border-gray-300'}`} />
          )} />
          {errors.motivation && <p className="text-xs text-red-600 mt-1">{errors.motivation.message}</p>}
        </div>

        <div>
          <label htmlFor="vol-availability" className="block text-sm font-medium mb-1">Availability *</label>
          <Controller name="availability" control={control} render={({ field }) => (
            <select {...field} id="vol-availability" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="part-time">Part-time</option>
              <option value="full-time">Full-time</option>
              <option value="occasional">Occasional</option>
            </select>
          )} />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50">
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VolunteerModal;
