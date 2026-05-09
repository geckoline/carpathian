import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { ProjectData } from '@/types/project';

export const useProjectFilters = (projects: ProjectData[]) => {
  const { searchTerm, statusFilter, fieldFilter, countryFilter, sortKey, sortDirection } = useAppStore((s) => s.filters);

  const filtered = useMemo(() => {
    let result = projects.filter((project) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' ||
        project.name.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term) ||
        project.location.toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesField = fieldFilter === 'all' || project.field.toLowerCase() === fieldFilter.toLowerCase();
      const matchesCountry = countryFilter === 'all' || (project.country?.toLowerCase() === countryFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesField && matchesCountry;
    });

    result = [...result].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [projects, searchTerm, statusFilter, fieldFilter, countryFilter, sortKey, sortDirection]);

  return { filteredProjects: filtered, count: filtered.length };
};
