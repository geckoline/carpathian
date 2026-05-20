import type { FormEvent, ReactNode } from 'react';
import { Modal } from '@/components/common/Modal';

export interface StepInfo {
  label: string;
}

interface WizardShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentStep: number;
  steps: StepInfo[];
  onNext: () => void;
  onBack: () => void;
  canGoNext: boolean;
  isSubmitting?: boolean;
  isOnline?: boolean;
  submitError?: string | null;
  onReset?: () => void;
  submitTestId?: string;
  onSubmit?: (e: FormEvent) => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const WizardShell = ({
  isOpen, onClose, title, currentStep, steps,
  onNext, onBack, canGoNext, isSubmitting = false,
  isOnline = true, submitError, onReset, submitTestId,
  onSubmit, children, size = 'lg',
}: WizardShellProps) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const nav = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[var(--color-soft-border)] px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
        >
          Cancel
        </button>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-[var(--color-soft-border)] px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
          >
            Reset
          </button>
        )}
      </div>
      <div className="flex gap-2">
        {!isFirstStep && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-[var(--color-soft-border)] px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
          >
            Back
          </button>
        )}
        {isLastStep ? (
          <button
            type="submit"
            form="wizard-form"
            disabled={isSubmitting || !isOnline || !canGoNext}
            data-testid={submitTestId}
            className="rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white hover:bg-primary-600 transition focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Add Project'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className="rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white hover:bg-primary-600 transition focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size} footer={nav}>
      {/* Progress stepper */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          {steps.map((step, i) => {
            const isActive = i === currentStep;
            const isCompleted = i < currentStep;
            return (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  transition-colors duration-200
                  ${isActive ? 'bg-primary-500 text-white ring-2 ring-primary-200' : ''}
                  ${isCompleted ? 'bg-primary-100 text-primary-700' : ''}
                  ${!isActive && !isCompleted ? 'bg-[var(--color-panel-surface-soft)] text-text-muted' : ''}
                `}>
                  {isCompleted ? '✓' : i + 1}
                </div>
                <span className={`
                  text-xs mt-1 hidden sm:block
                  ${isActive ? 'font-semibold text-primary-700' : ''}
                  ${isCompleted ? 'text-primary-600' : ''}
                  ${!isActive && !isCompleted ? 'text-text-muted' : ''}
                `}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 h-1.5 bg-[var(--color-soft-border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <form id="wizard-form" onSubmit={onSubmit}>
        {/* Offline banner */}
        {!isOnline && (
          <p className="rounded-[var(--radius-panel)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 mb-4" role="alert">
            You are offline. Submissions are disabled until your connection is restored.
          </p>
        )}

        {/* Error banner */}
        {submitError && (
          <p className="rounded-[var(--radius-panel)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mb-4" role="alert">
            {submitError}
          </p>
        )}

        {/* Step content */}
        <div className="space-y-4">
          {children}
        </div>
      </form>
    </Modal>
  );
};

export default WizardShell;
