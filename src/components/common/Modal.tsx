import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    const focusable = contentRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    (focusable as HTMLElement)?.focus();

    return () => {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key !== 'Tab' || !contentRef.current) return;

    const focusable = Array.from(contentRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
    if (focusable.length === 0) return;

    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }, [onClose]);

  if (!isOpen) return null;
  const modal = (
    <div
      ref={overlayRef}
      data-testid="modal-overlay"
      className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={handleKeyDown}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        ref={contentRef}
        className={`relative z-[4010] max-h-[90vh] w-full ${sizes[size]} overflow-y-auto rounded-xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]`}
      >
        <header className="flex items-center justify-between border-b p-4">
          <h2 id="modal-title" className="text-lg font-semibold text-primary-700">{title}</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Close modal">
            <X size={20} />
          </button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default Modal;
