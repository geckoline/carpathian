import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  onExportCSV: () => void;
  onExportJSON: () => void;
  disabled?: boolean;
}

export const ExportButton = ({ onExportCSV, onExportJSON, disabled }: ExportButtonProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-soft-border)] bg-[var(--color-panel-surface)] px-3 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        aria-label="Export data"
        aria-expanded={open}
      >
        <Download size={14} />
        Export
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-36 rounded-[var(--radius-panel)] border border-[var(--color-soft-border)] bg-[var(--color-panel-surface)] shadow-[var(--shadow-panel)]">
          <button
            type="button"
            onClick={() => { onExportCSV(); setOpen(false); }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-t-[var(--radius-panel)]"
          >
            Export as CSV
          </button>
          <button
            type="button"
            onClick={() => { onExportJSON(); setOpen(false); }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-b-[var(--radius-panel)]"
          >
            Export as JSON
          </button>
        </div>
      )}
    </div>
  );
};
