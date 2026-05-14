import { useState } from 'react';
import { Modal } from '@/components/common/Modal';

export type ConflictField = {
  key: string;
  label: string;
  current: string;
  imported: string;
};

interface ImportConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fields: ConflictField[];
  onConfirm: (selectedKeys: string[]) => void;
}

export const ImportConflictDialog = ({ isOpen, onClose, fields, onConfirm }: ImportConflictDialogProps) => {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set(fields.map(f => f.key)));
  const allSelected = selectedKeys.size === fields.length;

  const toggleField = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelectedKeys(new Set());
    else setSelectedKeys(new Set(fields.map(f => f.key)));
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedKeys));
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Duplicate Expert Detected" size="md">
      <p className="text-sm text-text-muted mb-4">
        An expert with matching fields already exists. Select which imported values to apply:
      </p>

      <div className="mb-3">
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {fields.map((field) => (
          <label
            key={field.key}
            className="flex items-center gap-3 rounded-lg border border-[var(--color-panel-border)] p-3 text-sm hover:bg-surface-muted cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedKeys.has(field.key)}
              onChange={() => toggleField(field.key)}
              className="mt-0.5"
            />
            <div className="flex-1 grid grid-cols-3 gap-2">
              <span className="font-medium text-primary-700">{field.label}</span>
              <span className="text-text-muted line-through decoration-gray-400">{field.current}</span>
              <span className="text-green-700 font-medium">{field.imported}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selectedKeys.size === 0}
          className="px-4 py-2 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
        >
          Confirm ({selectedKeys.size} field{selectedKeys.size !== 1 ? 's' : ''})
        </button>
      </div>
    </Modal>
  );
};

export default ImportConflictDialog;
