import { useFormContext, Controller } from 'react-hook-form';
import { COUNTRY_OPTIONS, getCountryName } from '@/utils/countries';
import type { WizardFormData } from '../wizardTypes';

const carpathianCountries = COUNTRY_OPTIONS.filter(c => c.isCarpathian);
const extendedCountries = COUNTRY_OPTIONS.filter(c => !c.isCarpathian);

export const DetailsStep = () => {
  const { control, formState: { errors } } = useFormContext<WizardFormData>();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Additional Details</h3>

      <div>
        <label htmlFor="wizard-year" className="block text-sm font-medium mb-1">Year Range *</label>
        <Controller
          name="yearRange"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              id="wizard-year"
              placeholder="2024-2028"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.yearRange ? 'border-red-500' : 'border-[var(--color-soft-border)]'
              }`}
              aria-invalid={!!errors.yearRange}
            />
          )}
        />
        {errors.yearRange && <p className="text-xs text-red-600 mt-1">{errors.yearRange.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Countries *</label>
        <Controller
          name="countries"
          control={control}
          render={({ field }) => (
            <div className="space-y-1">
              <p className="text-xs font-medium text-text-muted mb-1">Carpathian Countries</p>
              <div className="grid grid-cols-2 gap-1">
                {carpathianCountries.map(({ code }) => {
                  const isSelected = field.value?.includes(code);
                  return (
                    <label
                      key={code}
                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm transition-colors ${
                        isSelected ? 'bg-primary-50 text-primary-800' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected ?? false}
                        onChange={() => {
                          if (isSelected) {
                            field.onChange(field.value.filter((c: string) => c !== code));
                          } else {
                            field.onChange([...(field.value ?? []), code]);
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      {getCountryName(code)}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs font-medium text-text-muted mb-1 mt-2">Extended Countries</p>
              <div className="grid grid-cols-2 gap-1">
                {extendedCountries.map(({ code }) => {
                  const isSelected = field.value?.includes(code);
                  return (
                    <label
                      key={code}
                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm transition-colors ${
                        isSelected ? 'bg-primary-50 text-primary-800' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected ?? false}
                        onChange={() => {
                          if (isSelected) {
                            field.onChange(field.value.filter((c: string) => c !== code));
                          } else {
                            field.onChange([...(field.value ?? []), code]);
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      {getCountryName(code)}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        />
        {errors.countries && <p className="text-xs text-red-600 mt-1">{errors.countries.message}</p>}
      </div>
    </div>
  );
};
