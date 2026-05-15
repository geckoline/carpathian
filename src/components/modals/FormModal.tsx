import type { ReactNode } from 'react';
import { Modal } from '@/components/common/Modal';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  isSubmitting?: boolean;
  isOnline?: boolean;
  submitError?: string | null;
  onSubmit: () => void;
  size?: 'sm' | 'md' | 'lg';
  submitDisabled?: boolean;
  submitTestId?: string;
  initialFocus?: string;
  cancelLabel?: string;
  resetLabel?: string;
  onReset?: () => void;
  secondaryAction?: ReactNode;
  children: ReactNode;
}

export const FormModal = ({
  isOpen, onClose, title, submitLabel, isSubmitting, isOnline = true,
  submitError, onSubmit, size = 'md', submitDisabled, submitTestId,
  initialFocus, cancelLabel = 'Cancel', resetLabel = 'Reset', onReset, secondaryAction, children,
}: FormModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size} initialFocus={initialFocus}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {!isOnline && (
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
            You are offline. Submissions are disabled until your connection is restored.
          </p>
        )}
        {submitError && (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {submitError}
          </p>
        )}
        {children}
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                className="rounded border border-[var(--color-soft-border)] px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {resetLabel}
              </button>
            ) : null}
            {secondaryAction}
          </div>
          <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded border border-[var(--color-soft-border)] px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">{cancelLabel}</button>
          <button
            type="submit"
            disabled={isSubmitting || !isOnline || submitDisabled}
            data-testid={submitTestId}
            className="rounded bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : submitLabel}
          </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default FormModal;
