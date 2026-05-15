import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { loadAppData } from '@/services/loadAppData';

const fetchData = (setProjects: any, setExperts: any, setLoading: any, setError: any) => {
  setLoading(true);
  loadAppData()
    .then(({ projects, experts }) => {
      setProjects(projects);
      setExperts(experts);
    })
    .catch((err) => {
      setError(err.message);
    })
    .finally(() => {
      setLoading(false);
    });
};

export const useLoadAppData = () => {
  const setProjects = useAppStore(s => s.setProjects);
  const setExperts = useAppStore(s => s.setExperts);
  const setLoading = useAppStore(s => s.setLoading);
  const setError = useAppStore(s => s.setError);
  const fetchRef = useRef<() => void>();

  fetchRef.current = () => fetchData(setProjects, setExperts, setLoading, setError);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) fetchRef.current!();
    return () => { cancelled = true; };
  }, [setProjects, setExperts, setLoading, setError]);

  useEffect(() => {
    const handleOnline = () => {
      useAppStore.getState().setOnlineStatus(true);
      fetchRef.current?.();
    };
    const handleOffline = () => useAppStore.getState().setOnlineStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
};
