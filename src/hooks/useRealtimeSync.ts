import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { loadAppData } from '@/services/loadAppData';

export const useRealtimeSync = () => {
  const { setProjects, setExperts, setLoading, setError } = useAppStore();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    loadAppData()
      .then(({ projects, experts }) => {
        if (cancelled) return;
        setProjects(projects);
        setExperts(experts);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setProjects, setExperts, setLoading, setError]);

  useEffect(() => {
    const handleOnline = () => useAppStore.getState().setOnlineStatus(true);
    const handleOffline = () => useAppStore.getState().setOnlineStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
};
