import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { useDebounce } from '@/hooks/useDebounce';

/* 
  FILTER FLIPS EXPLAINED:
  "Filter flips" occur when switching datasets or tabs causes filters to reset unexpectedly.
  RECOMMENDATION: Persist filters in URL params. This ensures:
  1. Filters survive dataset switches & tab changes
  2. URLs are shareable/bookmarkable
  3. No "flip" UX disruption
  Implementation: Sync Zustand filters ↔ URL search params with debounced updates.
*/

export const FilterBar = () => {
  const { filters, setSearchTerm, setStatusFilter, setFieldFilter, clearFilters } = useAppStore();
  const [localSearch, setLocalSearch] = useState(filters.searchTerm);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    if (debouncedSearch === filters.searchTerm) return;
    setSearchTerm(debouncedSearch);
  }, [debouncedSearch, filters.searchTerm, setSearchTerm]);
  useEffect(() => { setLocalSearch(filters.searchTerm); }, [filters.searchTerm]);

  const hasActiveFilters = filters.searchTerm !== '' || filters.statusFilter !== 'all' || filters.fieldFilter !== 'all' || filters.countryFilter !== 'all';

  return (
    <section className="mb-6 p-4 bg-surface-muted rounded-lg flex flex-wrap gap-4 items-end" aria-label="Project filters">
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="search-input" className="block text-xs font-medium text-text-muted mb-1">Search</label>
        <input id="search-input" type="text" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Projects, locations, keywords..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
      </div>

      <div className="w-[140px]">
        <label htmlFor="status-filter" className="block text-xs font-medium text-text-muted mb-1">Status</label>
        <select id="status-filter" value={filters.statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="all">All</option><option value="active">Active</option><option value="past">Past</option><option value="planned">Planned</option>
        </select>
      </div>

      <div className="w-[140px]">
        <label htmlFor="field-filter" className="block text-xs font-medium text-text-muted mb-1">Field</label>
        <select id="field-filter" value={filters.fieldFilter} onChange={(e) => setFieldFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="all">All Fields</option><option value="Biodiversity">Biodiversity</option><option value="Spatial Development">Spatial Development</option><option value="Water">Water</option><option value="Agriculture">Agriculture</option><option value="Forest">Forest</option><option value="Tourism">Tourism</option><option value="Cultural Heritage">Cultural Heritage</option><option value="Industry &amp; Energy">Industry &amp; Energy</option><option value="Environmental Assessment">Environmental Assessment</option><option value="Education &amp; Awareness">Education &amp; Awareness</option><option value="Climate Change">Climate Change</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button onClick={clearFilters} className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 bg-white hover:bg-red-50" aria-label="Clear all filters">Clear</button>
      )}
    </section>
  );
};

export default FilterBar;
