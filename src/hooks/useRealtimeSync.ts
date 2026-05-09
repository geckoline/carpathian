import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { apiService } from '@/services/apiService';
import { mockApi } from '@/services/mockApi';

async function fetchWithFallback<T>(
  fetch: () => Promise<T>,
  fallback: () => Promise<T>,
  isEmpty: (data: T) => boolean
): Promise<T> {
  try {
    const data = await fetch();
    if (isEmpty(data)) return fallback();
    return data;
  } catch {
    return fallback();
  }
}

export const useRealtimeSync = () => {
  const { setProjects, setExperts, setLoading, setError } = useAppStore();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetchWithFallback(
        () => apiService.getProjects(),
        () => mockApi.getProjects(),
        (d) => d.length === 0
      ),
      fetchWithFallback(
        () => apiService.getExperts(),
        () => mockApi.getExperts(),
        (d) => d.length === 0
      ),
    ])
      .then(([projects, experts]) => {
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
