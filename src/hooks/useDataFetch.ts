import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { apiService } from '@/services/apiService';
import { ProjectSchema } from '@/types/project';
import { ExpertSchema } from '@/types/expert';

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
      setProjects(projects.map(p => ProjectSchema.parse(p)));
      setExperts(experts.map(e => ExpertSchema.parse(e)));
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
