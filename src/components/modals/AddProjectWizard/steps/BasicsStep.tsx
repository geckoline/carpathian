import { useFormContext, Controller } from 'react-hook-form';
import { getCategoryOptions } from '@/utils/categories';
import type { WizardFormData } from '../wizardTypes';

const categoryOptions = getCategoryOptions();

export const BasicsStep = () => {
  const { control, formState: { errors } } = useFormContext<WizardFormData>();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Information</h3>

      <div>
        <label htmlFor="wizard-name" className="block text-sm font-medium mb-1">Project Name *</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              id="wizard-name"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.name ? 'border-red-500' : 'border-[var(--color-soft-border)]'
              }`}
              aria-invalid={!!errors.name}
            />
          )}
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="wizard-status" className="block text-sm font-medium mb-1">Status *</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <select {...field} id="wizard-status" className="w-full px-3 py-2 border border-[var(--color-soft-border)] rounded focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="past">Past</option>
              </select>
            )}
          />
        </div>
        <div>
          <label htmlFor="wizard-field" className="block text-sm font-medium mb-1">Scientific Field *</label>
          <Controller
            name="field"
            control={control}
            render={({ field }) => (
              <select {...field} id="wizard-field" data-testid="wizard-field-input" className="w-full px-3 py-2 border border-[var(--color-soft-border)] rounded focus:outline-none focus:ring-2 focus:ring-primary-500">
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            )}
          />
          {errors.field && <p className="text-xs text-red-600 mt-1">{errors.field.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="wizard-description" className="block text-sm font-medium mb-1">Description *</label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              id="wizard-description"
              rows={4}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.description ? 'border-red-500' : 'border-[var(--color-soft-border)]'
              }`}
              aria-invalid={!!errors.description}
            />
          )}
        />
        {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
      </div>
    </div>
  );
};
