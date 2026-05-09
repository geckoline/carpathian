import { Suspense, lazy, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { useDataFetch } from '@/hooks/useDataFetch';
import { useApplyAccessibility } from '@/hooks/useApplyAccessibility';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { useExpertFilters } from '@/hooks/useExpertFilters';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { ExpertCard } from '@/components/cards/ExpertCard';
import FilterBar from '@/components/layout/FilterBar';
import StatsSection from '@/components/layout/StatsSection';
import AccessibilityControls from '@/components/layout/AccessibilityControls';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { AddProjectModal } from '@/components/modals/AddProjectModal';

const MapView = lazy(() => import('@/components/map/MapView'));

export default function App() {
  useApplyAccessibility();
  const { retry, isRetrying } = useDataFetch();
  const { addProject } = useAppStore();
  const { filters, data, setActiveTab } = useAppStore();
  const { filteredProjects } = useProjectFilters(data.projects);
  const { filteredExperts } = useExpertFilters();
  const isLoading = data.loading && data.projects.length === 0 && !data.error;

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  const handleAddProject = async (formData: any) => {
    addProject({ ...formData, lat: formData.lat ?? 47.5, lng: formData.lng ?? 25.0 });
    await new Promise(resolve => setTimeout(resolve, 400));
    setIsAddProjectOpen(false);
  };

  if (data.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-red-600 p-6 text-center" role="alert">
        <p className="text-xl font-semibold">Failed to load platform data</p>
        <p className="text-sm text-text-muted max-w-md">{data.error}</p>
        <button onClick={() => retry()} disabled={isRetrying} className="mt-2 px-4 py-2 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500">
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <main className="flex flex-col min-h-screen p-4 md:p-6 lg:p-8 max-w-7xl mx-auto" tabIndex={-1}>
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-primary-700">Citizen Science Platform</h1>
          <p className="text-text-muted mt-1">Explore projects & connect with experts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsAddProjectOpen(true)} className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition focus:outline-none focus:ring-2 focus:ring-primary-500">
            + Add Project
          </button>
          <AccessibilityControls />
        </div>
      </header>

      <StatsSection />
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b mb-4">
        <FilterBar />
      </div>

      <section className="mb-6 flex gap-2" aria-label="View tabs">
        <button onClick={() => setActiveTab('projects')} className={`px-3 py-1 rounded text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${filters.activeTab === 'projects' ? 'bg-primary-500 text-white' : 'bg-white text-primary-500 border border-primary-500'}`} aria-pressed={filters.activeTab === 'projects'}>Projects</button>
        <button onClick={() => setActiveTab('experts')} className={`px-3 py-1 rounded text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${filters.activeTab === 'experts' ? 'bg-primary-500 text-white' : 'bg-white text-primary-500 border border-primary-500'}`} aria-pressed={filters.activeTab === 'experts'}>Experts</button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section aria-live="polite" className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <SkeletonCard type="project" />
              <SkeletonCard type="project" />
            </>
          ) : (
            <>
              {filters.activeTab === 'projects' && filteredProjects.map((p) => (
                <ProjectCard key={p.id} {...p} />
              ))}
              {filters.activeTab === 'experts' && filteredExperts.map((e) => (
                <ExpertCard key={e.id} {...e} />
              ))}
            </>
          )}
          {(!isLoading && (filters.activeTab === 'projects' ? filteredProjects : filteredExperts).length === 0) && (
            <div className="col-span-full text-center py-12 text-text-muted">No results match your filters.</div>
          )}
        </section>

        <aside className="lg:col-span-1">
          <Suspense fallback={<div className="h-[400px] bg-surface-muted rounded-xl animate-pulse flex items-center justify-center text-text-muted">Loading map...</div>}>
            <MapView />
          </Suspense>
        </aside>
      </div>

      <AddProjectModal 
        isOpen={isAddProjectOpen} 
        onClose={() => setIsAddProjectOpen(false)} 
        onSubmit={handleAddProject} 
      />
    </main>
  );
}
