import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import type { ProjectData } from '@/types/project';
import { normalizeCategoryId } from '@/utils/categories';
import { filterProjectsBySearch } from '@/utils/fuzzySearch';

export const useProjectFilters = (projects: ProjectData[]) => {
  const { searchTerm, statusFilter, fieldFilter, countryFilter, sortKey, sortDirection } = useAppStore((s) => s.filters);

  const filtered = useMemo(() => {
    let result = filterProjectsBySearch(projects, searchTerm).filter((project) => {
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const projectCategory = normalizeCategoryId(project.categoryId ?? project.field);
      const filterCategory = normalizeCategoryId(fieldFilter);
      const matchesField = fieldFilter === 'all' || (!!projectCategory && projectCategory === filterCategory);
      const matchesCountry = countryFilter === 'all' || (project.countries?.some((c) => c === countryFilter) ?? false);

      return matchesStatus && matchesField && matchesCountry;
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
