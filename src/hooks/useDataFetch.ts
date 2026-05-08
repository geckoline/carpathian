import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { apiService } from '@/services/apiService';

export const useDataFetch = () => {
  const { setLoading, setProjects, setExperts, setError } = useAppStore();
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsRetrying(true);
    try {
      const [projects, experts] = await Promise.all([
        apiService.getProjects(),
        apiService.getExperts(),
      ]);
      setProjects(projects);
      setExperts(experts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [setLoading, setProjects, setExperts, setError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const retry = useCallback(() => { fetchData(); }, [fetchData]);
  return { retry, isRetrying };
};
