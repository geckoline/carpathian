import { Suspense, lazy, useState, useMemo, useCallback } from 'react';
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
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { VirtualizedCardGrid } from '@/components/ui/VirtualizedCardGrid';
import { ExportButton } from '@/components/ui/ExportButton';
import { downloadAsCSV, downloadAsJSON } from '@/utils/dataExport';
import { getDatasetExperts, getDatasetProjects } from '@/utils/datasetScope';
import type { ProjectData } from '@/types/project';
import type { ExpertData, ExpertFormData } from '@/types/expert';
import type { ProjectFormData } from '@/components/modals/AddProjectModal';
import type { VolunteerFormData } from '@/components/modals/VolunteerModal';

const MapView = lazy(() => import('@/components/map/MapView'));
const AddProjectModal = lazy(() => import('@/components/modals/AddProjectModal'));
const AddExpertModal = lazy(() => import('@/components/modals/AddExpertModal'));
const VolunteerModal = lazy(() => import('@/components/modals/VolunteerModal'));

export default function App() {
  useRealtimeSync();
  useUrlSync();
  useApplyAccessibility();
  const dataset = useAppStore(s => s.dataset);
  const isOnline = useAppStore(s => s.isOnline);
  const activeTab = useAppStore(s => s.filters.activeTab);
  const searchTerm = useAppStore(s => s.filters.searchTerm);
  const statusFilter = useAppStore(s => s.filters.statusFilter);
  const fieldFilter = useAppStore(s => s.filters.fieldFilter);
  const countryFilter = useAppStore(s => s.filters.countryFilter);
  const storeProjects = useAppStore(s => s.data.projects);
  const storeExperts = useAppStore(s => s.data.experts);
  const dataLoading = useAppStore(s => s.data.loading);
  const dataError = useAppStore(s => s.data.error);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const setDataset = useAppStore(s => s.setDataset);
  const clearFilters = useAppStore(s => s.clearFilters);

  const projectsToFilter = useMemo(
    () => getDatasetProjects(dataset, storeProjects),
    [dataset, storeProjects]
  );
  const expertsToFilter = useMemo(
    () => getDatasetExperts(dataset, storeProjects, storeExperts),
    [dataset, storeProjects, storeExperts]
  );
  const { filteredProjects } = useProjectFilters(projectsToFilter);
  const { filteredExperts } = useExpertFilters(expertsToFilter);
  const isLoading = dataLoading && storeProjects.length === 0 && !dataError;

  const addProjectModal = useModal();
  const addExpertModal = useModal();
  const volunteerModal = useModal();
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const { submitProject } = useProjectSubmission(setStatusMessage);
  const { submitVolunteerSubscription } = useVolunteerSubscription(setStatusMessage);
  const addExpert = useAppStore(s => s.addExpert);
  const renderCardItem = useCallback((item: ProjectData | ExpertData) => {
    if (activeTab === 'projects') {
      const project = item as ProjectData;
      const teamMembers = project.expertIds.map((id) => {
        const expert = storeExperts.find((e) => e.id === id);
        return { id, name: expert?.name ?? 'Unknown' };
      });
      let contact: string | undefined;
      if (project.website) {
        try { contact = `contact@${new URL(project.website).hostname}`; } catch { /* ignore */ }
      }
      if (!contact) {
        contact = storeExperts.find(e => e.id === project.expertIds[0])?.email;
      }
      return <ProjectCard key={project.id} {...project} teamMembers={teamMembers} contact={contact} />;
    }
    return <ExpertCard key={item.id} {...(item as ExpertData)} />;
  }, [activeTab, storeExperts]);

  const handleAddProjectSubmit = useCallback(async (data: ProjectFormData) => {
    await submitProject(data);
    addProjectModal.close();
  }, [submitProject, addProjectModal]);

  const handleAddExpertSubmit = useCallback(async (data: ExpertFormData) => {
    addExpert({
      id: crypto.randomUUID(),
      name: data.name,
      institution: data.institution,
      countries: data.countries,
      headline: data.headline,
      expertiseSubtitle: data.expertiseSubtitle,
      bio: data.bio,
      expertise: data.expertise,
      publications: data.publications,
      projects: data.projects,
      email: data.email,
      linkedin: data.linkedin,
      orcid: data.orcid,
      googleScholar: data.googleScholar,
      profileImageUrl: data.profileImageUrl,
      importMetadata: data.importMetadata ?? { source: 'manual', importedAt: new Date().toISOString() },
    });
    setStatusMessage({ tone: 'success', text: 'Expert added successfully.' });
    addExpertModal.close();
  }, [addExpert, addExpertModal, setStatusMessage]);

  const handleVolunteerSubmit = useCallback(async (data: VolunteerFormData) => {
    await submitVolunteerSubscription(data);
    volunteerModal.close();
  }, [submitVolunteerSubscription, volunteerModal]);

  const activeProjects = filteredProjects;
  const activeExperts = filteredExperts;
  const activeItems = activeTab === 'projects' ? activeProjects : activeExperts;
  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || fieldFilter !== 'all' || countryFilter !== 'all';
  const emptyState = activeTab === 'projects'
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

  if (dataError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-red-600 p-6 text-center" role="alert">
        <p className="text-xl font-semibold">Failed to load platform data</p>
        <p className="text-sm text-text-muted max-w-md">{dataError}</p>
        <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 text-sm bg-primary-500 text-white rounded-full hover:bg-primary-600 transition focus:outline-none focus:ring-2 focus:ring-primary-500">Retry</button>
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
            aria-controls="dataset-panel"
            onClick={() => setDataset('cs')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-full transition focus:outline-none focus:ring-2 focus:ring-primary-500 sm:flex-none sm:px-4 ${dataset === 'cs' ? 'bg-[var(--color-panel-surface)] text-primary-700 shadow-sm' : 'text-text-muted hover:text-primary-600'}`}
          >
            Citizen Science
          </button>
          <button
            role="tab"
            aria-selected={dataset === 'all'}
            aria-controls="dataset-panel"
            onClick={() => setDataset('all')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-full transition focus:outline-none focus:ring-2 focus:ring-primary-500 sm:flex-none sm:px-4 ${dataset === 'all' ? 'bg-[var(--color-panel-surface)] text-primary-700 shadow-sm' : 'text-text-muted hover:text-primary-600'}`}
          >
            All Carpathian
          </button>
        </div>
      </div>

      <section id="dataset-panel" role="tabpanel" className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row min-h-[460px] gap-4 sm:gap-6 lg:h-[70vh] lg:min-h-[500px]">
          <div className="h-[460px] flex-1 min-w-0 rounded-[var(--radius-panel)] overflow-hidden border border-[var(--color-panel-border)] shadow-[var(--shadow-panel)] relative bg-[var(--color-panel-surface)] sm:h-[560px] lg:h-auto">
            <ErrorBoundary>
              <Suspense fallback={<div className="h-full w-full bg-surface-muted animate-pulse flex items-center justify-center text-text-muted">Loading map...</div>}>
                <MapView projects={projectsToFilter} />
              </Suspense>
            </ErrorBoundary>
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

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2" role="tablist" aria-label="Content view">
            <button
              role="tab"
              aria-selected={activeTab === 'projects'}
              aria-controls="view-panel"
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${activeTab === 'projects' ? 'bg-primary-500 text-white' : 'border border-[var(--color-soft-border)] text-text-muted hover:bg-[var(--color-panel-surface-soft)]'}`}
            >
              Projects
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'experts'}
              aria-controls="view-panel"
              onClick={() => setActiveTab('experts')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${activeTab === 'experts' ? 'bg-primary-500 text-white' : 'border border-[var(--color-soft-border)] text-text-muted hover:bg-[var(--color-panel-surface-soft)]'}`}
            >
              Experts
            </button>
          </div>
          <ExportButton
            onExportCSV={() => downloadAsCSV(activeItems as unknown as Record<string, unknown>[], `${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`)}
            onExportJSON={() => downloadAsJSON(activeItems as unknown[], `${activeTab}-${new Date().toISOString().slice(0, 10)}.json`)}
            disabled={activeItems.length === 0}
          />
        </div>

        <section id="view-panel" role="tabpanel" className="mt-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <SkeletonCard type="project" />
              <SkeletonCard type="project" />
            </div>
          ) : activeItems.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div className="col-span-full rounded-[var(--radius-panel)] border-2 border-dashed border-[var(--color-soft-border)] bg-gradient-to-b from-[var(--color-panel-surface)] to-[var(--color-panel-surface-soft)] shadow-[var(--shadow-panel)] px-6 py-16 text-center text-text-muted">
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
            </div>
          ) : (
            <VirtualizedCardGrid
              items={activeItems}
              renderItem={renderCardItem}
              minVirtualizeCount={50}
            />
          )}
        </section>
      </section>

      {addProjectModal.isOpen && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <AddProjectModal isOpen={addProjectModal.isOpen} onClose={addProjectModal.close} onSubmit={handleAddProjectSubmit} isOnline={isOnline} />
          </Suspense>
        </ErrorBoundary>
      )}
      {addExpertModal.isOpen && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <AddExpertModal
            isOpen={addExpertModal.isOpen}
            onClose={addExpertModal.close}
            onSubmit={handleAddExpertSubmit}
            isOnline={isOnline}
          />
        </Suspense>
        </ErrorBoundary>
      )}
      {volunteerModal.isOpen && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <VolunteerModal isOpen={volunteerModal.isOpen} onClose={volunteerModal.close} onSubmit={handleVolunteerSubmit} isOnline={isOnline} />
          </Suspense>
        </ErrorBoundary>
      )}
    </main>
  );
}
