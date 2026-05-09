import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { ExpertData } from '@/types/expert';

export const useExpertFilters = (experts?: ExpertData[]) => {
  const store = useAppStore();
  const data = experts ?? store.data.experts;
  const filters = store.filters;

  const filteredExperts = useMemo(() => {
    return data.filter((expert) => {
      if (filters.fieldFilter !== 'all' && !expert.expertise.some((e) => e.toLowerCase().includes(filters.fieldFilter.toLowerCase()))) {
        return false;
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const nameMatch = expert.name.toLowerCase().includes(term);
        const instMatch = expert.institution.toLowerCase().includes(term);
        const bioMatch = expert.bio.toLowerCase().includes(term);
        if (!nameMatch && !instMatch && !bioMatch) return false;
      }
      return true;
    });
  }, [data, filters.fieldFilter, filters.searchTerm]);

  return { filteredExperts };
};
