import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import type { ExpertData } from '@/types/expert';
import { filterExpertsBySearch } from '@/utils/fuzzySearch';

export const useExpertFilters = (experts?: ExpertData[]) => {
  const storeExperts = useAppStore(s => s.data.experts);
  const filters = useAppStore(s => s.filters);
  const data = experts ?? storeExperts;

  const filteredExperts = useMemo(() => {
    return filterExpertsBySearch(data, filters.searchTerm).filter((expert) => {
      if (filters.fieldFilter !== 'all' && !expert.expertise.some((e) => e.toLowerCase().includes(filters.fieldFilter.toLowerCase()))) {
        return false;
      }
      if (filters.countryFilter && filters.countryFilter !== 'all' && !(expert.countries?.some((c) => c === filters.countryFilter) ?? false)) {
        return false;
      }
      return true;
    });
  }, [data, filters.countryFilter, filters.fieldFilter, filters.searchTerm]);

  return { filteredExperts };
};
