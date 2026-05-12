import { useEffect, useMemo, useState } from 'react';
import { useAppStore, type FilterState } from '@/store/appStore';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProjectData } from '@/types/project';
import { normalizeCategoryId } from '@/utils/categories';
import { getProjectFilterOptions, type ProjectFilterOptions } from '@/utils/projectFilterOptions';

type FilterControlsProps = {
  projects?: ProjectData[];
  idPrefix?: string;
  variant?: 'full' | 'compact';
};

const statusLabels: Record<Exclude<FilterState['statusFilter'], 'all'>, string> = {
  active: 'Active',
  planned: 'Planned',
  past: 'Past',
};

const hasActiveProjectFilters = (filters: FilterState) => filters.searchTerm !== '' ||
  filters.statusFilter !== 'all' ||
  filters.fieldFilter !== 'all' ||
  filters.countryFilter !== 'all';

const isCategoryAvailable = (options: ProjectFilterOptions, fieldFilter: string) => {
  const categoryId = normalizeCategoryId(fieldFilter);
  return !!categoryId && options.categories.some((category) => category.id === categoryId);
};

export const FilterControls = ({ projects, idPrefix = 'project-filters', variant = 'full' }: FilterControlsProps) => {
  const storeProjects = useAppStore(s => s.data.projects);
  const filters = useAppStore(s => s.filters);
  const setSearchTerm = useAppStore(s => s.setSearchTerm);
  const setStatusFilter = useAppStore(s => s.setStatusFilter);
  const setFieldFilter = useAppStore(s => s.setFieldFilter);
  const setCountryFilter = useAppStore(s => s.setCountryFilter);
  const clearFilters = useAppStore(s => s.clearFilters);
  const optionProjects = projects ?? storeProjects;
  const [localSearch, setLocalSearch] = useState(filters.searchTerm);
  const debouncedSearch = useDebounce(localSearch, 300);
  const options = useMemo(() => getProjectFilterOptions(optionProjects, filters), [optionProjects, filters]);
  const normalizedFieldFilter = normalizeCategoryId(filters.fieldFilter) ?? filters.fieldFilter;
  const hasActiveFilters = hasActiveProjectFilters(filters);

  useEffect(() => {
    if (debouncedSearch === filters.searchTerm) return;
    setSearchTerm(debouncedSearch);
  }, [debouncedSearch, filters.searchTerm, setSearchTerm]);

  useEffect(() => {
    setLocalSearch(filters.searchTerm);
  }, [filters.searchTerm]);

  const clearInvalidLinkedFilters = (nextFilters: FilterState, nextOptions: ProjectFilterOptions, changedAxis: 'status' | 'field' | 'country') => {
    if (changedAxis !== 'status' && nextFilters.statusFilter !== 'all' && !nextOptions.statuses.includes(nextFilters.statusFilter)) {
      setStatusFilter('all');
    }
    if (changedAxis !== 'field' && nextFilters.fieldFilter !== 'all' && !isCategoryAvailable(nextOptions, nextFilters.fieldFilter)) {
      setFieldFilter('all');
    }
    if (changedAxis !== 'country' && nextFilters.countryFilter !== 'all' && !nextOptions.countries.includes(nextFilters.countryFilter)) {
      setCountryFilter('all');
    }
  };

  const handleStatusChange = (status: FilterState['statusFilter']) => {
    const nextFilters = { ...filters, statusFilter: status };
    setStatusFilter(status);
    clearInvalidLinkedFilters(nextFilters, getProjectFilterOptions(optionProjects, nextFilters), 'status');
  };

  const handleFieldChange = (field: string) => {
    const nextFilters = { ...filters, fieldFilter: field };
    setFieldFilter(field);
    clearInvalidLinkedFilters(nextFilters, getProjectFilterOptions(optionProjects, nextFilters), 'field');
  };

  const handleCountryChange = (country: string) => {
    const nextFilters = { ...filters, countryFilter: country };
    setCountryFilter(country);
    clearInvalidLinkedFilters(nextFilters, getProjectFilterOptions(optionProjects, nextFilters), 'country');
  };

  const gridClass = variant === 'compact'
    ? 'grid gap-3 sm:grid-cols-2'
    : 'grid gap-3 md:grid-cols-[minmax(220px,1fr)_150px_220px_180px_auto] md:items-end';
  const clearButtonClass = variant === 'compact'
    ? 'sm:col-span-2 rounded-lg border border-primary-200 px-3 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent'
    : 'rounded-lg border border-primary-200 px-3 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent';

  return (
    <div className={gridClass}>
      <div className={variant === 'compact' ? 'sm:col-span-2' : undefined}>
        <label htmlFor={`${idPrefix}-search-input`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-muted">Search</label>
        <input
          id={`${idPrefix}-search-input`}
          type="text"
          value={localSearch}
          onChange={(event) => setLocalSearch(event.target.value)}
          placeholder="Projects, experts, places, keywords..."
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-status-filter`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-muted">Status</label>
        <select
          id={`${idPrefix}-status-filter`}
          value={filters.statusFilter}
          onChange={(event) => handleStatusChange(event.target.value as FilterState['statusFilter'])}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All status</option>
          {options.statuses.map((status) => (
            <option key={status} value={status}>{statusLabels[status]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-field-filter`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-muted">Category</label>
        <select
          id={`${idPrefix}-field-filter`}
          value={normalizedFieldFilter}
          onChange={(event) => handleFieldChange(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All categories</option>
          {options.categories.map((category) => (
            <option key={category.id} value={category.id}>{category.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-country-filter`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-muted">Country</label>
        <select
          id={`${idPrefix}-country-filter`}
          value={filters.countryFilter}
          onChange={(event) => handleCountryChange(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All countries</option>
          {options.countries.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={clearFilters}
        disabled={!hasActiveFilters}
        className={clearButtonClass}
        aria-label="Clear all filters"
      >
        Clear
      </button>
    </div>
  );
};

export default FilterControls;
