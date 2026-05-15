import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import FocusTrap from 'focus-trap-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  const handleEscape = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  const modal = (
    <FocusTrap focusTrapOptions={{ initialFocus: '#modal-close-btn', fallbackFocus: '#modal-close-btn' }}>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        data-testid="modal-overlay"
        className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={handleEscape}
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`relative z-[4010] max-h-[90vh] w-full ${sizes[size]} overflow-y-auto rounded-[var(--radius-panel)] border border-[var(--color-panel-border)] bg-[var(--color-panel-surface)] shadow-[var(--shadow-surface)]`}
        >
          <header className="flex items-center justify-between border-b border-[var(--color-panel-border)] p-4">
            <h2 id="modal-title" className="text-lg font-semibold text-primary-700">{title}</h2>
            <button id="modal-close-btn" onClick={onClose} className="rounded p-1 hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Close modal">
              <X size={20} />
            </button>
          </header>
          <div className="p-4">{children}</div>
        </motion.div>
      </motion.div>
    </FocusTrap>
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && modal}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
