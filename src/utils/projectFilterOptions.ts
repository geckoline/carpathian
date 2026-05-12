import type { FilterState } from '@/store/appStore';
import type { ProjectData } from '@/types/project';
import { getCategoryOptions, normalizeCategoryId, type CategoryOption } from '@/utils/categories';
import { filterProjectsBySearch } from '@/utils/fuzzySearch';

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
    project.country?.toLowerCase() === filters.countryFilter.toLowerCase();

  return matchesStatus && matchesField && matchesCountry;
};

const projectsForAxis = (projects: ProjectData[], filters: FilterState, axis: ProjectFilterAxis) => {
  const searchScopedProjects = filterProjectsBySearch(projects, filters.searchTerm);
  return searchScopedProjects.filter((project) => projectMatchesFacetFilters(project, filters, axis));
};

export const getProjectFilterOptions = (projects: ProjectData[], filters: FilterState): ProjectFilterOptions => {
  const statusProjects = projectsForAxis(projects, filters, 'status');
  const categoryProjects = projectsForAxis(projects, filters, 'field');
  const countryProjects = projectsForAxis(projects, filters, 'country');

  const availableStatuses = new Set<ProjectStatusOption>(statusProjects.map((project) => project.status));
  const availableCategoryIds = new Set(
    categoryProjects
      .map((project) => normalizeCategoryId(project.categoryId ?? project.field))
      .filter(Boolean),
  );
  const countries = [...new Set(countryProjects.map((project) => project.country).filter(Boolean) as string[])]
    .sort((a, b) => a.localeCompare(b));

  return {
    statuses: statusOrder.filter((status) => availableStatuses.has(status)),
    categories: categoryOptions.filter((category) => availableCategoryIds.has(category.id)),
    countries,
  };
};
