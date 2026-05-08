import { useAppStore } from '@/store/appStore';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import Modal from '@/components/common/Modal';

export const AccessibilityControls = () => {
  const { a11y, setA11y } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Accessibility settings"
      >
        <Settings size={20} className="text-text-muted" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Accessibility Settings">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Font Size: {a11y.fontSize}px</label>
            <input
              type="range" min="12" max="24" step="2"
              value={a11y.fontSize}
              onChange={(e) => setA11y({ fontSize: Number(e.target.value) })}
              className="w-full accent-primary-500"
              aria-valuemin={12} aria-valuemax={24}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">High Contrast</span>
            <button
              onClick={() => setA11y({ highContrast: !a11y.highContrast })}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${a11y.highContrast ? 'bg-primary-500' : 'bg-gray-300'}`}
              role="switch" aria-checked={a11y.highContrast} aria-label="Toggle high contrast"
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${a11y.highContrast ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Reduce Motion</span>
            <button
              onClick={() => setA11y({ reducedMotion: !a11y.reducedMotion })}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${a11y.reducedMotion ? 'bg-primary-500' : 'bg-gray-300'}`}
              role="switch" aria-checked={a11y.reducedMotion} aria-label="Toggle reduce motion"
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${a11y.reducedMotion ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AccessibilityControls;
