import { useEffect, useMemo, useState, memo } from 'react';
import { useAppStore, type FilterState } from '@/store/appStore';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProjectData } from '@/types/project';
import { normalizeCategoryId } from '@/utils/categories';
import { getProjectFilterOptions, type ProjectFilterOptions } from '@/utils/projectFilterOptions';
import { COUNTRY_OPTIONS, getCountryName } from '@/utils/countries';

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

const labelClass = 'mb-1 block text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--color-field-note)] sm:text-xs';
const controlClass = 'w-full rounded-lg border border-[var(--color-soft-border)] bg-[var(--color-panel-surface)] px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 sm:px-3';

const FilterControlsInner = ({ projects, idPrefix = 'project-filters', variant = 'full' }: FilterControlsProps) => {
  const storeProjects = useAppStore(s => s.data.projects);
  const searchTerm = useAppStore(s => s.filters.searchTerm);
  const statusFilter = useAppStore(s => s.filters.statusFilter);
  const fieldFilter = useAppStore(s => s.filters.fieldFilter);
  const countryFilter = useAppStore(s => s.filters.countryFilter);
  const setSearchTerm = useAppStore(s => s.setSearchTerm);
  const setStatusFilter = useAppStore(s => s.setStatusFilter);
  const setFieldFilter = useAppStore(s => s.setFieldFilter);
  const setCountryFilter = useAppStore(s => s.setCountryFilter);
  const clearFilters = useAppStore(s => s.clearFilters);
  const optionProjects = projects ?? storeProjects;
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const debouncedSearch = useDebounce(localSearch, 300);

  const filters = useMemo<FilterState>(() => ({
    searchTerm, statusFilter, fieldFilter, countryFilter,
    activeTab: 'projects', sortKey: 'name', sortDirection: 'asc',
  }), [searchTerm, statusFilter, fieldFilter, countryFilter]);

  const options = useMemo(
    () => getProjectFilterOptions(optionProjects, filters),
    [optionProjects, searchTerm, statusFilter, fieldFilter, countryFilter]
  );
  const normalizedFieldFilter = normalizeCategoryId(fieldFilter) ?? fieldFilter;
  const hasActiveFilters = hasActiveProjectFilters(filters);

  useEffect(() => {
    if (debouncedSearch === searchTerm) return;
    setSearchTerm(debouncedSearch);
  }, [debouncedSearch, setSearchTerm]);

  useEffect(() => {
    if (localSearch === searchTerm) return;
    setLocalSearch(searchTerm);
  }, [searchTerm]);

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
    ? 'grid grid-cols-2 gap-2 sm:gap-3'
    : 'grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-[minmax(220px,1fr)_150px_220px_180px_auto] md:items-end';
  const searchFieldClass = variant === 'compact' ? 'col-span-2' : 'col-span-2 md:col-span-1';
  const clearButtonClass = variant === 'compact'
    ? 'col-span-2 rounded-lg border border-[var(--color-soft-border)] px-3 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:border-[var(--color-soft-border)] disabled:text-gray-400 disabled:hover:bg-transparent'
    : 'col-span-2 rounded-lg border border-[var(--color-soft-border)] px-3 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:border-[var(--color-soft-border)] disabled:text-gray-400 disabled:hover:bg-transparent md:col-span-1';

  return (
    <div className={gridClass} data-testid={`${idPrefix}-controls`}>
      <div className={searchFieldClass} data-testid={`${idPrefix}-search-field`}>
        <label htmlFor={`${idPrefix}-search-input`} className={labelClass}>Search</label>
        <input
          id={`${idPrefix}-search-input`}
          type="text"
          value={localSearch}
          onChange={(event) => setLocalSearch(event.target.value)}
          placeholder="Projects, experts, places, keywords..."
          className={controlClass}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-status-filter`} className={labelClass}>Status</label>
        <select
          id={`${idPrefix}-status-filter`}
          value={statusFilter}
          onChange={(event) => handleStatusChange(event.target.value as FilterState['statusFilter'])}
          className={controlClass}
        >
          <option value="all">All status</option>
          {options.statuses.map((status) => (
            <option key={status} value={status}>{statusLabels[status]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-field-filter`} className={labelClass}>Category</label>
        <select
          id={`${idPrefix}-field-filter`}
          value={normalizedFieldFilter}
          onChange={(event) => handleFieldChange(event.target.value)}
          className={controlClass}
        >
          <option value="all">All categories</option>
          {options.categories.map((category) => (
            <option key={category.id} value={category.id}>{category.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-country-filter`} className={labelClass}>Country</label>
        <select
          id={`${idPrefix}-country-filter`}
          value={countryFilter}
          onChange={(event) => handleCountryChange(event.target.value)}
          className={controlClass}
        >
          <option value="all">All countries</option>
          <optgroup label="Carpathian">
            {options.countries
              .filter((code) => COUNTRY_OPTIONS.find((c) => c.code === code)?.isCarpathian)
              .map((code) => (
                <option key={code} value={code}>{getCountryName(code)}</option>
              ))}
          </optgroup>
          <optgroup label="Extended">
            {options.countries
              .filter((code) => !COUNTRY_OPTIONS.find((c) => c.code === code)?.isCarpathian)
              .map((code) => (
                <option key={code} value={code}>{getCountryName(code)}</option>
              ))}
          </optgroup>
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

export const FilterControls = memo(FilterControlsInner);

export default FilterControls;
