import type { FilterState } from '@/types/app';
import type { ProjectData } from '@/types/project';
import { getCategoryOptions, normalizeCategoryId, type CategoryOption } from '@/utils/categories';
import { filterProjectsBySearch } from '@/utils/fuzzySearch';
import { COUNTRY_OPTIONS } from '@/utils/countries';

type ProjectFilterAxis = 'status' | 'field' | 'country';
type ProjectStatusOption = Exclude<FilterState['statusFilter'], 'all'>;

export type ProjectFilterOptions = {
  statuses: ProjectStatusOption[];
  categories: CategoryOption[];
  countries: string[];
};

const statusOrder: ProjectStatusOption[] = ['active', 'planned', 'past'];
const categoryOptions = getCategoryOptions();

const projectMatchesFacetFilters = (
  project: ProjectData,
  filters: FilterState,
  ignoredAxis?: ProjectFilterAxis,
) => {
  const matchesStatus = ignoredAxis === 'status' || filters.statusFilter === 'all' || project.status === filters.statusFilter;
  const projectCategory = normalizeCategoryId(project.categoryId ?? project.field);
  const filterCategory = normalizeCategoryId(filters.fieldFilter);
  const matchesField = ignoredAxis === 'field' || filters.fieldFilter === 'all' || (!!projectCategory && projectCategory === filterCategory);
  const matchesCountry = ignoredAxis === 'country' || filters.countryFilter === 'all' ||
    (project.countries?.some((c) => c === filters.countryFilter) ?? false);

  return matchesStatus && matchesField && matchesCountry;
};

export const getProjectFilterOptions = (projects: ProjectData[], filters: FilterState): ProjectFilterOptions => {
  const searchScopedProjects = filterProjectsBySearch(projects, filters.searchTerm);
  const statusProjects = searchScopedProjects.filter((project) => projectMatchesFacetFilters(project, filters, 'status'));
  const categoryProjects = searchScopedProjects.filter((project) => projectMatchesFacetFilters(project, filters, 'field'));
  const countryProjects = searchScopedProjects.filter((project) => projectMatchesFacetFilters(project, filters, 'country'));

  const availableStatuses = new Set<ProjectStatusOption>(statusProjects.map((project) => project.status));
  const availableCategoryIds = new Set(
    categoryProjects
      .map((project) => normalizeCategoryId(project.categoryId ?? project.field))
      .filter(Boolean),
  );
  const usedCountryCodes = new Set(countryProjects.flatMap((project) => project.countries ?? []));
  const countries = COUNTRY_OPTIONS
    .filter((c) => usedCountryCodes.has(c.code))
    .sort((a, b) => {
      if (a.isCarpathian !== b.isCarpathian) return a.isCarpathian ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((c) => c.code);

  return {
    statuses: statusOrder.filter((status) => availableStatuses.has(status)),
    categories: categoryOptions.filter((category) => availableCategoryIds.has(category.id)),
    countries,
  };
};
