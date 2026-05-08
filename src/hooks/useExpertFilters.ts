// src/hooks/useExpertFilters.ts
import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';

export const useExpertFilters = () => {
  const { data, filters } = useAppStore();

  const filteredExperts = useMemo(() => {
    return data.experts.filter((expert) => {
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
  }, [data.experts, filters.fieldFilter, filters.searchTerm]);

  return { filteredExperts };
};
