import { useEffect } from 'react';
import { useAppStore, type ThemeMode } from '@/store/appStore';
import { useLocalStorage } from './useLocalStorage';

export const useApplyAccessibility = () => {
  const { a11y, setA11y, theme = 'light', setTheme } = useAppStore();

  const [, setStoredA11y] = useLocalStorage('ccs-a11y-settings', a11y);
  const [, setStoredTheme] = useLocalStorage<ThemeMode>('ccs-theme', theme);

  useEffect(() => {
    const stored = localStorage.getItem('ccs-a11y-settings');
    if (stored) {
      try { setA11y(JSON.parse(stored)); } catch { /* ignore */ }
    }
    const storedTheme = localStorage.getItem('ccs-theme');
    if (storedTheme && setTheme) {
      try { setTheme(JSON.parse(storedTheme)); } catch { /* ignore */ }
    }
  }, [setA11y, setTheme]);

  useEffect(() => { setStoredA11y(a11y); }, [a11y, setStoredA11y]);
  useEffect(() => { setStoredTheme(theme); }, [setStoredTheme, theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${a11y.fontSize}px`;
    root.classList.toggle('high-contrast', a11y.highContrast);
    root.classList.toggle('reduced-motion-forced', a11y.reducedMotion);
  }, [a11y]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-light', theme === 'light');
    root.classList.toggle('theme-dark', theme === 'dark');
    root.classList.toggle('theme-reduced-color', theme === 'reduced');
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return { a11y, theme };
};
