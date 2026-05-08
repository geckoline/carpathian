import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { useLocalStorage } from './useLocalStorage';

export const useApplyAccessibility = () => {
  const { a11y, setA11y } = useAppStore();

  const [, setStoredA11y] = useLocalStorage('ccs-a11y-settings', a11y);

  useEffect(() => {
    const stored = localStorage.getItem('ccs-a11y-settings');
    if (stored) {
      try { setA11y(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [setA11y]);

  useEffect(() => { setStoredA11y(a11y); }, [a11y, setStoredA11y]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${a11y.fontSize}px`;
    if (a11y.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    if (a11y.reducedMotion) {
      root.classList.add('reduced-motion-forced');
    } else {
      root.classList.remove('reduced-motion-forced');
    }
  }, [a11y]);

  return { a11y };
};
