import { useState } from 'react';
import { useAppStore } from '@/store/appStore';

interface MapSidebarProps {
  projects: any[];
  onAddProject?: () => void;
  onVolunteer?: () => void;
}

export const MapSidebar = ({ projects, onAddProject, onVolunteer }: MapSidebarProps) => {
  const { filters, setSearchTerm, setStatusFilter, setFieldFilter, setCountryFilter, clearFilters, setSelectedProjectId, setHoveredProjectId } = useAppStore();
  const [localSearch, setLocalSearch] = useState(filters.searchTerm);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
    setSearchTerm(e.target.value);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-md border border-surface-muted overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-primary-700">Projects</h2>
          <span className="text-sm text-text-muted">{projects.length} Projects</span>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-200 flex gap-2">
        {onAddProject && (
          <button onClick={onAddProject} className="flex-1 px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium">
            + Add Project
          </button>
        )}
        {onVolunteer && (
          <button onClick={onVolunteer} className="flex-1 px-3 py-2 text-sm bg-[#009966] text-white rounded-lg hover:opacity-90 transition font-medium">
            Volunteer
          </button>
        )}
      </div>

      <div className="px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="Search projects..."
            className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-200 space-y-2">
        <div className="flex gap-2">
          <select
            value={filters.statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="past">Past</option>
            <option value="planned">Planned</option>
          </select>

          <select
            value={filters.fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          >
            <option value="all">All Fields</option>
            <option value="biodiversity">Biodiversity</option>
            <option value="hydrology">Hydrology</option>
            <option value="wildlife">Wildlife</option>
            <option value="climate">Climate</option>
          </select>

          <select
            value={filters.countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="w-[100px] px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          >
            <option value="all">All Countries</option>
            <option value="Romania">Romania</option>
            <option value="Poland">Poland</option>
            <option value="Slovakia">Slovakia</option>
            <option value="Ukraine">Ukraine</option>
          </select>
        </div>

        {(filters.searchTerm || filters.statusFilter !== 'all' || filters.fieldFilter !== 'all' || filters.countryFilter !== 'all') && (
          <button onClick={clearFilters} className="w-full px-2 py-1.5 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50">
            Clear All Filters
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {projects.length > 0 ? (
          projects.map(project => (
            <div
              key={project.id}
              className="relative p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg hover:translate-x-1 transition-all overflow-hidden"
              onClick={() => setSelectedProjectId(project.id)}
              onMouseEnter={() => setHoveredProjectId(project.id)}
              onMouseLeave={() => setHoveredProjectId(null)}
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#006633] to-[#00a050]" />
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm text-gray-900">{project.name}</h4>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full text-white uppercase tracking-wide ${
                  project.status === 'active' ? 'bg-gradient-to-r from-[#4CAF50] to-[#2E7D32]' :
                  project.status === 'planned' ? 'bg-gradient-to-r from-[#2196F3] to-[#0D47A1]' :
                  'bg-gradient-to-r from-[#9E9E9E] to-[#616161]'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-2">
                {project.location}
                <span className="ml-auto inline-block px-2 py-0.5 text-xs font-semibold rounded-full text-white bg-gradient-to-r from-[#006633] to-[#008040]">
                  {project.field}
                </span>
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-text-muted text-sm">No projects match your filters</div>
        )}
      </div>
    </div>
  );
};

export default MapSidebar;
