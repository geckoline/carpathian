import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { ExpertData } from '@/types/expert';
import { filterExpertsBySearch } from '@/utils/fuzzySearch';

export const useExpertFilters = (experts?: ExpertData[]) => {
  const store = useAppStore();
  const data = experts ?? store.data.experts;
  const filters = store.filters;

  const filteredExperts = useMemo(() => {
    return filterExpertsBySearch(data, filters.searchTerm).filter((expert) => {
      if (filters.fieldFilter !== 'all' && !expert.expertise.some((e) => e.toLowerCase().includes(filters.fieldFilter.toLowerCase()))) {
        return false;
      }
      if (filters.countryFilter && filters.countryFilter !== 'all' && expert.country.toLowerCase() !== filters.countryFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [data, filters.countryFilter, filters.fieldFilter, filters.searchTerm]);

  return { filteredExperts };
};
