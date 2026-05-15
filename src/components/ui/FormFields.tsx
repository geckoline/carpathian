import { Controller, type Control, type FieldErrors } from 'react-hook-form';

const inputBase = 'w-full rounded border bg-[var(--color-panel-surface)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60';
const inputError = 'border-red-500';
const inputNormal = 'border-[var(--color-soft-border)]';
const errorText = 'mt-1 text-xs text-red-600';
const labelClass = 'block text-sm font-medium mb-1';

const RequiredMark = () => (
  <span aria-hidden="true" className="text-red-600"> *</span>
);

const getErrorMessage = (errors: FieldErrors<any> | undefined, name: string) => (
  errors?.[name]?.message as string | undefined
);

const FieldLabel = ({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) => (
  <label htmlFor={htmlFor} className={labelClass}>
    {label}
    {required ? <RequiredMark /> : null}
    {required ? <span className="sr-only"> required</span> : null}
  </label>
);

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

export const FormInput = ({ name, label, control, errors, id, required, type = 'text', placeholder, disabled, testId }: FormInputProps) => (
  <div>
    <FieldLabel htmlFor={id} label={label} required={required} />
    <Controller name={name} control={control} render={({ field }) => (
      <input {...field} id={id} type={type} placeholder={placeholder} disabled={disabled}
        data-testid={testId}
        className={`${inputBase} ${errors?.[name] ? inputError : inputNormal}`}
        aria-invalid={!!errors?.[name]}
        aria-required={required || undefined}
        aria-describedby={errors?.[name] ? `${id}-error` : undefined}
      />
    )} />
    {errors?.[name] && <p id={`${id}-error`} className={errorText}>{getErrorMessage(errors, name)}</p>}
  </div>
);

type FormSelectProps = FormFieldProps & {
  children: React.ReactNode;
  disabled?: boolean;
  testId?: string;
};

export const FormSelect = ({ name, label, control, errors, id, required, children, disabled, testId }: FormSelectProps) => (
  <div>
    <FieldLabel htmlFor={id} label={label} required={required} />
    <Controller name={name} control={control} render={({ field }) => (
      <select {...field} id={id} disabled={disabled} data-testid={testId}
        className={`${inputBase} ${errors?.[name] ? inputError : inputNormal}`}
        aria-invalid={!!errors?.[name]}
        aria-required={required || undefined}
        aria-describedby={errors?.[name] ? `${id}-error` : undefined}
      >
        {children}
      </select>
    )} />
    {errors?.[name] && <p id={`${id}-error`} className={errorText}>{getErrorMessage(errors, name)}</p>}
  </div>
);

type FormTextareaProps = FormFieldProps & {
  rows?: number;
  placeholder?: string;
  testId?: string;
};

export const FormTextarea = ({ name, label, control, errors, id, required, rows = 3, placeholder, testId }: FormTextareaProps) => (
  <div>
    <FieldLabel htmlFor={id} label={label} required={required} />
    <Controller name={name} control={control} render={({ field }) => (
      <textarea {...field} id={id} rows={rows} placeholder={placeholder} data-testid={testId}
        className={`${inputBase} ${errors?.[name] ? inputError : inputNormal}`}
        aria-invalid={!!errors?.[name]}
        aria-required={required || undefined}
        aria-describedby={errors?.[name] ? `${id}-error` : undefined}
      />
    )} />
    {errors?.[name] && <p id={`${id}-error`} className={errorText}>{getErrorMessage(errors, name)}</p>}
  </div>
);

export { FieldLabel, inputBase, inputError, inputNormal };
