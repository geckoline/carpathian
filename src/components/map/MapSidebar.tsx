import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import FilterControls from '@/components/layout/FilterControls';
import type { ProjectData } from '@/types/project';
import { getCategoryLabel } from '@/utils/categories';
import { getCompactCategoryLabel, getProjectStatusLabel } from '@/utils/projectBadges';

interface MapSidebarProps {
  projects: ProjectData[];
  filterProjects?: ProjectData[];
  onAddProject?: () => void;
  onAddExpert?: () => void;
  onVolunteer?: () => void;
}

export const MapSidebar = ({ projects, filterProjects = projects, onAddProject, onAddExpert, onVolunteer }: MapSidebarProps) => {
  const setSelectedProjectId = useAppStore(s => s.setSelectedProjectId);
  const selectedProjectId = useAppStore(s => s.ui.selectedProjectId);
  const reducedMotion = useAppStore(s => s.a11y.reducedMotion);
  const [pulsedProjectId, setPulsedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProjectId) return;

    document.getElementById(`map-sidebar-card-${selectedProjectId}`)?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
    setPulsedProjectId(selectedProjectId);

    const pulseTimer = window.setTimeout(() => {
      setPulsedProjectId((current) => current === selectedProjectId ? null : current);
    }, 1600);

    return () => window.clearTimeout(pulseTimer);
  }, [selectedProjectId, reducedMotion]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-panel-border)] bg-[var(--color-panel-surface)] shadow-[var(--shadow-panel)]">
      <div className="border-b border-[var(--color-panel-border)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-primary-700">Map Projects</h2>
            <p className="mt-1 text-xs text-text-muted">Select a project to sync the map, popup, and sidebar.</p>
          </div>
          <span className="rounded-full bg-[var(--color-panel-surface-soft)] px-3 py-1 text-sm font-semibold text-primary-700">
            {projects.length}
          </span>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[var(--color-panel-border)] px-4 py-3">
        {onAddProject && (
          <button
            type="button"
            onClick={onAddProject}
            className="flex-1 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            + Add Project
          </button>
        )}
        {onAddExpert && (
          <button
            type="button"
            onClick={onAddExpert}
            className="flex-1 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            + Add Expert
          </button>
        )}
        {onVolunteer && (
          <button
            type="button"
            onClick={onVolunteer}
            className="flex-1 rounded-lg bg-status-active px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Volunteer alerts
          </button>
        )}
      </div>

      <div className="border-b border-[var(--color-panel-border)] bg-[var(--color-panel-surface-soft)] p-4">
        <FilterControls projects={filterProjects} idPrefix="map-sidebar-filters" variant="compact" />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {projects.length > 0 ? (
          projects.map((project) => {
            const isSelected = selectedProjectId === project.id;
            const isPulsing = pulsedProjectId === project.id;
            const categoryLabel = getCategoryLabel(project.categoryId ?? project.field);
            const compactCategoryLabel = getCompactCategoryLabel(categoryLabel);

            return (
              <button
                key={project.id}
                id={`map-sidebar-card-${project.id}`}
                type="button"
                className={`relative w-full overflow-hidden rounded-[var(--radius-panel)] border bg-[var(--color-panel-surface)] p-4 text-left transition-all hover:translate-x-1 hover:shadow-[var(--shadow-panel)] focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  isSelected
                    ? 'border-primary-500 shadow-[var(--shadow-panel)] ring-2 ring-primary-500/20'
                    : 'border-[var(--color-panel-border)]'
                } ${isPulsing ? 'map-sidebar-card-pulse' : ''}`}
                onClick={() => setSelectedProjectId(project.id)}
                aria-current={isSelected ? 'true' : undefined}
                aria-label={`Select ${project.name} on the map`}
              >
                <span className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-primary-700 to-primary-500" aria-hidden="true" />
                <span className="mb-2 flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-900">{project.name}</span>
                  <span
                    className={`project-status-pill project-status-pill-${project.status} map-sidebar-status-pill badge-single-line`}
                    data-testid={`map-sidebar-status-${project.id}`}
                  >
                    {getProjectStatusLabel(project.status)}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{project.displayLocation || project.regionLabel || project.country || 'Carpathian region'}</span>
                  <span
                    className="project-category-pill map-sidebar-category-pill badge-single-line ml-auto"
                    data-testid={`map-sidebar-category-${project.id}`}
                    title={categoryLabel}
                    aria-label={`Category: ${categoryLabel}`}
                  >
                    {compactCategoryLabel}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--color-panel-border)] bg-[var(--color-panel-surface-soft)] px-4 py-8 text-center text-sm text-text-muted" role="status">
            <h3 className="text-base font-semibold text-primary-700">No mapped projects</h3>
            <p className="mt-2">Use the filter bar above the cards or add a new project when you have field data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSidebar;
