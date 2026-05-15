import { Controller, type Control, type FieldErrors } from 'react-hook-form';

const inputBase = 'w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500';
const inputError = 'border-red-500';
const inputNormal = 'border-[var(--color-soft-border)]';

type FormFieldProps = {
  name: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: FieldErrors<any>;
  id: string;
  required?: boolean;
};

type FormInputProps = FormFieldProps & {
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
};

export const FormInput = ({ name, label, control, errors, id, type = 'text', placeholder, disabled, testId }: FormInputProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium mb-1">{label}</label>
    <Controller name={name} control={control} render={({ field }) => (
      <input {...field} id={id} type={type} placeholder={placeholder} disabled={disabled}
        data-testid={testId}
        className={`${inputBase} ${errors?.[name] ? inputError : inputNormal}`}
        aria-invalid={!!errors?.[name]}
      />
    )} />
    {errors?.[name] && <p className="text-xs text-red-600 mt-1">{errors[name]?.message as string}</p>}
  </div>
);

type FormSelectProps = FormFieldProps & {
  children: React.ReactNode;
  disabled?: boolean;
  testId?: string;
};

export const FormSelect = ({ name, label, control, errors, id, children, disabled, testId }: FormSelectProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium mb-1">{label}</label>
    <Controller name={name} control={control} render={({ field }) => (
      <select {...field} id={id} disabled={disabled} data-testid={testId}
        className={`${inputBase} ${errors?.[name] ? inputError : inputNormal}`}
        aria-invalid={!!errors?.[name]}
      >
        {children}
      </select>
    )} />
    {errors?.[name] && <p className="text-xs text-red-600 mt-1">{errors[name]?.message as string}</p>}
  </div>
);

type FormTextareaProps = FormFieldProps & {
  rows?: number;
  placeholder?: string;
  testId?: string;
};

export const FormTextarea = ({ name, label, control, errors, id, rows = 3, placeholder, testId }: FormTextareaProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium mb-1">{label}</label>
    <Controller name={name} control={control} render={({ field }) => (
      <textarea {...field} id={id} rows={rows} placeholder={placeholder} data-testid={testId}
        className={`${inputBase} ${errors?.[name] ? inputError : inputNormal}`}
        aria-invalid={!!errors?.[name]}
      />
    )} />
    {errors?.[name] && <p className="text-xs text-red-600 mt-1">{errors[name]?.message as string}</p>}
  </div>
);
