import { Suspense, lazy, useState, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useUrlSync } from '@/hooks/useUrlSync';
import { useApplyAccessibility } from '@/hooks/useApplyAccessibility';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { useExpertFilters } from '@/hooks/useExpertFilters';
import { useProjectSubmission, type StatusMessage } from '@/hooks/useProjectSubmission';
import { useVolunteerSubscription } from '@/hooks/useVolunteerSubscription';
import { useModal } from '@/hooks/useModal';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { ExpertCard } from '@/components/cards/ExpertCard';
import StatsSection from '@/components/layout/StatsSection';
import FilterBar from '@/components/layout/FilterBar';
import MapSidebar from '@/components/map/MapSidebar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import AccessibilityControls from '@/components/layout/AccessibilityControls';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { getDatasetExperts, getDatasetProjects } from '@/utils/datasetScope';

const MapView = lazy(() => import('@/components/map/MapView'));
const AddProjectModal = lazy(() => import('@/components/modals/AddProjectModal'));
const AddExpertModal = lazy(() => import('@/components/modals/AddExpertModal'));
const VolunteerModal = lazy(() => import('@/components/modals/VolunteerModal'));

export default function App() {
  useRealtimeSync();
  useUrlSync();
  useApplyAccessibility();
  const {
    dataset, isOnline,
    filters, data, setActiveTab, setDataset, clearFilters,
  } = useAppStore();

  const projectsToFilter = useMemo(
    () => getDatasetProjects(dataset, data.projects),
    [dataset, data.projects]
  );
  const expertsToFilter = useMemo(
    () => getDatasetExperts(dataset, data.projects, data.experts),
    [dataset, data.projects, data.experts]
  );
  const { filteredProjects } = useProjectFilters(projectsToFilter);
  const { filteredExperts } = useExpertFilters(expertsToFilter);
  const isLoading = data.loading && data.projects.length === 0 && !data.error;

  const addProjectModal = useModal();
  const addExpertModal = useModal();
  const volunteerModal = useModal();
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const { submitProject } = useProjectSubmission(setStatusMessage);
  const { submitVolunteerSubscription } = useVolunteerSubscription(setStatusMessage);
  const addExpert = useAppStore(s => s.addExpert);

  const activeProjects = filteredProjects;
  const activeExperts = filteredExperts;
  const activeItems = filters.activeTab === 'projects' ? activeProjects : activeExperts;
  const hasActiveFilters = filters.searchTerm !== '' || filters.statusFilter !== 'all' || filters.fieldFilter !== 'all' || filters.countryFilter !== 'all';
  const emptyState = filters.activeTab === 'projects'
    ? {
        title: 'No projects found',
        description: 'Adjust your filters or add a project to start building the map.',
      }
    : {
        title: dataset === 'cs' ? 'No linked experts found' : 'No experts found',
        description: dataset === 'cs'
          ? 'Citizen science experts appear here when they are linked to a CS project by lead expert or contact email.'
          : 'Adjust your filters to find experts across the Carpathian network.',
      };

  if (data.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-red-600 p-6 text-center" role="alert">
        <p className="text-xl font-semibold">Failed to load platform data</p>
        <p className="text-sm text-text-muted max-w-md">{data.error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 text-sm bg-primary-500 text-white rounded hover:bg-primary-600">Retry</button>
      </div>
    );
  }

  return (
    <main className="flex flex-col min-h-screen" tabIndex={-1}>
      <header className="px-4 md:px-6 lg:px-8 pt-3 sm:pt-4 md:pt-6 lg:pt-8 max-w-7xl mx-auto w-full mb-3 sm:mb-4 flex justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-primary-700">Citizen Science Platform</h1>
          <p className="text-text-muted mt-1 text-sm sm:text-base">Explore projects & connect with experts</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AccessibilityControls />
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-3 sm:mb-4">
        {statusMessage && (
          <div
            className={`mb-4 rounded-[var(--radius-panel)] shadow-[var(--shadow-panel)] border px-4 py-3 text-sm ${
              statusMessage.tone === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : statusMessage.tone === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-red-200 bg-red-50 text-red-800'
            }`}
            role={statusMessage.tone === 'error' ? 'alert' : 'status'}
          >
            {statusMessage.text}
          </div>
        )}
        <StatsSection projects={projectsToFilter} experts={expertsToFilter} />
      </div>

      <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-3 sm:mb-4">
        <div className="flex w-full gap-1 rounded-[var(--radius-panel)] border border-[var(--color-panel-border)] bg-[var(--color-panel-surface)] p-1 shadow-[var(--shadow-panel)] sm:w-fit" role="tablist" aria-label="Dataset selection">
          <button
            role="tab"
            aria-selected={dataset === 'cs'}
            onClick={() => setDataset('cs')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary-500 sm:flex-none sm:px-4 ${dataset === 'cs' ? 'bg-[var(--color-panel-surface)] text-primary-700 shadow-sm' : 'text-text-muted hover:text-primary-600'}`}
          >
            Citizen Science
          </button>
          <button
            role="tab"
            aria-selected={dataset === 'all'}
            onClick={() => setDataset('all')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary-500 sm:flex-none sm:px-4 ${dataset === 'all' ? 'bg-[var(--color-panel-surface)] text-primary-700 shadow-sm' : 'text-text-muted hover:text-primary-600'}`}
          >
            All Carpathian
          </button>
        </div>
      </div>

      <section className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row min-h-[460px] gap-4 sm:gap-6 lg:h-[70vh] lg:min-h-[500px]">
          <div className="h-[460px] flex-1 min-w-0 rounded-[var(--radius-panel)] overflow-hidden border border-[var(--color-panel-border)] shadow-[var(--shadow-panel)] relative bg-[var(--color-panel-surface)] sm:h-[560px] lg:h-auto">
            <Suspense fallback={<div className="h-full w-full bg-surface-muted animate-pulse flex items-center justify-center text-text-muted">Loading map...</div>}>
              <MapView projects={projectsToFilter} />
            </Suspense>
          </div>
          <aside className="w-full lg:w-[380px] lg:flex-shrink-0">
            <MapSidebar
              projects={activeProjects}
              filterProjects={projectsToFilter}
              onAddProject={addProjectModal.open}
              onAddExpert={addExpertModal.open}
              onVolunteer={volunteerModal.open}
            />
          </aside>
        </div>
      </section>

      <section className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-8">
        <FilterBar />

        <div className="flex gap-2 mb-4" aria-label="View tabs">
          <button onClick={() => setActiveTab('projects')} className={`px-3 py-1 rounded text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${filters.activeTab === 'projects' ? 'bg-primary-500 text-white' : 'bg-white text-primary-500 border border-primary-500'}`} aria-pressed={filters.activeTab === 'projects'}>Projects</button>
          <button onClick={() => setActiveTab('experts')} className={`px-3 py-1 rounded text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${filters.activeTab === 'experts' ? 'bg-primary-500 text-white' : 'bg-white text-primary-500 border border-primary-500'}`} aria-pressed={filters.activeTab === 'experts'}>Experts</button>
        </div>

        <section aria-live="polite" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" role="status">
          {isLoading ? (
            <><SkeletonCard type="project" /><SkeletonCard type="project" /></>
          ) : (
            <>
              {filters.activeTab === 'projects' && activeProjects.map(p => (
                <ProjectCard key={p.id} {...p} />
              ))}
              {filters.activeTab === 'experts' && activeExperts.map(e => (
                <ExpertCard key={e.id} {...e} />
              ))}
            </>
          )}
          {(!isLoading && activeItems.length === 0) && (
            <div className="col-span-full rounded-[var(--radius-panel)] border border-dashed border-[var(--color-panel-border)] bg-[var(--color-panel-surface)] shadow-[var(--shadow-panel)] px-6 py-12 text-center text-text-muted">
              <h2 className="text-lg font-semibold text-primary-700">{emptyState.title}</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm">{emptyState.description}</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-full border border-primary-500 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>
      </section>

      {addProjectModal.isOpen && (
        <Suspense fallback={null}>
          <AddProjectModal isOpen={addProjectModal.isOpen} onClose={addProjectModal.close} onSubmit={async (data) => { await submitProject(data); addProjectModal.close(); }} isOnline={isOnline} />
        </Suspense>
      )}
      {addExpertModal.isOpen && (
        <Suspense fallback={null}>
          <AddExpertModal
            isOpen={addExpertModal.isOpen}
            onClose={addExpertModal.close}
            onSubmit={async (data) => {
              addExpert({
                id: crypto.randomUUID(),
                name: data.name,
                institution: data.institution,
                country: data.country,
                degree: data.degree,
                headline: data.headline,
                expertiseSubtitle: data.expertiseSubtitle,
                bio: data.bio,
                expertise: data.expertise,
                email: data.email,
                linkedin: data.linkedin,
                orcid: data.orcid,
                googleScholar: data.googleScholar,
                importMetadata: { source: 'manual', importedAt: new Date().toISOString() },
              });
              setStatusMessage({ tone: 'success', text: 'Expert added successfully.' });
              addExpertModal.close();
            }}
            isOnline={isOnline}
          />
        </Suspense>
      )}
      {volunteerModal.isOpen && (
        <Suspense fallback={null}>
          <VolunteerModal isOpen={volunteerModal.isOpen} onClose={volunteerModal.close} onSubmit={async (data) => { await submitVolunteerSubscription(data); volunteerModal.close(); }} isOnline={isOnline} />
        </Suspense>
      )}
    </main>
  );
}
