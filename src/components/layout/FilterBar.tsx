import { useState, useEffect } from 'react';
import { useAppStore, SortKey, FilterState } from '@/store/appStore';
import { useDebounce } from '@/hooks/useDebounce';

const sortLabels: Record<SortKey, string> = { name: 'Name', status: 'Status', field: 'Field', yearRange: 'Year' };

export const FilterBar = () => {
  const { filters, setSearchTerm, setStatusFilter, setFieldFilter, setAreaFilter, setSortKey, setSortDirection, clearFilters } = useAppStore();
  const [localSearch, setLocalSearch] = useState(filters.searchTerm);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    if (debouncedSearch === filters.searchTerm) {
      return;
    }
    setSearchTerm(debouncedSearch);
  }, [debouncedSearch, filters.searchTerm, setSearchTerm]);

  useEffect(() => {
    setLocalSearch(filters.searchTerm);
  }, [filters.searchTerm]);

  const hasActiveFilters = filters.searchTerm !== '' || filters.statusFilter !== 'all' || filters.fieldFilter !== 'all' || filters.areaFilter !== 'all';

  return (
    <section className="mb-6 p-4 bg-surface-muted rounded-lg flex flex-wrap gap-4 items-end" aria-label="Project filters">
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="search-input" className="block text-xs font-medium text-text-muted mb-1">Search</label>
        <input
          id="search-input"
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Projects, locations, keywords..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
      </div>
      <div className="w-[140px]">
        <label htmlFor="status-filter" className="block text-xs font-medium text-text-muted mb-1">Status</label>
        <select
          id="status-filter"
          value={filters.statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FilterState['statusFilter'])}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="past">Past</option>
          <option value="planned">Planned</option>
        </select>
      </div>
      <div className="w-[140px]">
        <label htmlFor="field-filter" className="block text-xs font-medium text-text-muted mb-1">Field</label>
        <select
          id="field-filter"
          value={filters.fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="all">All Fields</option>
          <option value="Biodiversity">Biodiversity</option>
          <option value="Hydrology">Hydrology</option>
          <option value="Wildlife">Wildlife</option>
        </select>
      </div>
      <div className="w-[140px]">
        <label htmlFor="area-filter" className="block text-xs font-medium text-text-muted mb-1">Area</label>
        <select
          id="area-filter"
          value={filters.areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="all">All Areas</option>
          <option value="carpathians">Carpathians</option>
          <option value="tatras">Tatras</option>
        </select>
      </div>
      <div className="w-[140px]">
        <label htmlFor="sort-select" className="block text-xs font-medium text-text-muted mb-1">Sort</label>
        <select
          id="sort-select"
          value={filters.sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          {Object.entries(sortLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
      <button
        onClick={() => setSortDirection(filters.sortDirection === 'asc' ? 'desc' : 'asc')}
        className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white hover:bg-gray-50"
        aria-label={`Sort direction: ${filters.sortDirection === 'asc' ? 'ascending' : 'descending'}`}
      >
        {filters.sortDirection === 'asc' ? '\u2191 Asc' : '\u2193 Desc'}
      </button>
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 bg-white hover:bg-red-50"
          aria-label="Clear all filters"
        >
          Clear
        </button>
      )}
    </section>
  );
};

export default FilterBar;
