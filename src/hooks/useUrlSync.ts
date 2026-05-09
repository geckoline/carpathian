import { useEffect, useRef } from 'react';

export const useUrlSync = () => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const el = document.getElementById(`project-card-${id}`);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('animate-pulse-ring');

    timeoutRef.current = setTimeout(() => {
      el.classList.remove('animate-pulse-ring');
    }, 3000);

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const updateUrl = (id: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (id) params.set('id', id); else params.delete('id');
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, '', newUrl);
  };

  return { updateUrl };
};
