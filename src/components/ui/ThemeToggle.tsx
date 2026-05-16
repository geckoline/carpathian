import { Moon, Sun, Droplets } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export const ThemeToggle = () => {
  const theme = useAppStore(s => s.theme);
  const setTheme = useAppStore(s => s.setTheme);

  return (
    <div className="flex items-center gap-1 bg-[var(--color-panel-surface)] rounded-[var(--radius-panel)] shadow-[var(--shadow-panel)] border border-[var(--color-soft-border)] p-1">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-full transition ${theme === 'light' ? 'bg-primary-500 text-white' : 'text-text-muted hover:bg-surface-muted'}`}
        aria-label="Light mode"
      >
        <Sun size={14} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-full transition ${theme === 'dark' ? 'bg-primary-500 text-white' : 'text-text-muted hover:bg-surface-muted'}`}
        aria-label="Dark mode"
      >
        <Moon size={14} />
      </button>
      <button
        onClick={() => setTheme('reduced')}
        className={`p-1.5 rounded-full transition ${theme === 'reduced' ? 'bg-primary-500 text-white' : 'text-text-muted hover:bg-surface-muted'}`}
        aria-label="Reduced colors mode"
      >
        <Droplets size={14} />
      </button>
    </div>
  );
};

export default ThemeToggle;
