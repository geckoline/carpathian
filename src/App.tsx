import { Suspense, lazy, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { apiService } from '@/services/apiService';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { useExpertFilters } from '@/hooks/useExpertFilters';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { ExpertCard } from '@/components/cards/ExpertCard';
import StatsSection from '@/components/layout/StatsSection';
import MapSidebar from '@/components/map/MapSidebar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import AccessibilityControls from '@/components/layout/AccessibilityControls';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { AddProjectModal } from '@/components/modals/AddProjectModal';
import { VolunteerModal } from '@/components/modals/VolunteerModal';

const MapView = lazy(() => import('@/components/map/MapView'));

export default function App() {
  useRealtimeSync();
  const {
    dataset, isOnline, addProject,
    filters, data, setActiveTab, setDataset,
  } = useAppStore();

  const csProjects = data.projects.filter(p => p.isCitizenScience);
  const csExperts = data.experts.filter(e => e.isCitizenScience ?? false);
  const projectsToFilter = dataset === 'cs' ? csProjects : data.projects;
  const expertsToFilter = dataset === 'cs' ? csExperts : data.experts;
  const { filteredProjects } = useProjectFilters(projectsToFilter);
  const { filteredExperts } = useExpertFilters(expertsToFilter);
  const isLoading = data.loading && data.projects.length === 0 && !data.error;

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [volunteerProjectId, setVolunteerProjectId] = useState<string | null>(null);

  const handleAddProject = async (formData: any) => {
    if (!isOnline) return;
    try {
      await apiService.addProject({ ...formData, lat: formData.lat ?? 47.5, lng: formData.lng ?? 25.0 });
      addProject(formData);
      setIsAddProjectOpen(false);
    } catch (err) {
      console.error('Failed to add project:', err);
    }
  };

  const handleVolunteer = async (formData: any) => {
    if (!isOnline) return;
    try {
      await apiService.addExpert({
        name: formData.name,
        institution: formData.organization || 'Independent',
        country: formData.country || 'Demo Region',
        degree: 'Volunteer',
        bio: formData.motivation,
        expertise: [formData.expertise],
      });
      setVolunteerProjectId(null);
    } catch (err) {
      console.error('Failed to submit volunteer:', err);
    }
  };

  const activeProjects = filteredProjects;
  const activeExperts = filteredExperts;

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
      <header className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8 max-w-7xl mx-auto w-full mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-primary-700">Citizen Science Platform</h1>
          <p className="text-text-muted mt-1">Explore projects & connect with experts</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AccessibilityControls />
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-4">
        <StatsSection projects={projectsToFilter} experts={expertsToFilter} />
      </div>

      <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-4">
        <div className="flex gap-1 bg-surface-muted rounded-lg p-1 w-fit" role="tablist" aria-label="Dataset selection">
          <button
            role="tab"
            aria-selected={dataset === 'cs'}
            onClick={() => setDataset('cs')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${dataset === 'cs' ? 'bg-white text-primary-700 shadow-sm' : 'text-text-muted hover:text-primary-600'}`}
          >
            Citizen Science
          </button>
          <button
            role="tab"
            aria-selected={dataset === 'all'}
            onClick={() => setDataset('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${dataset === 'all' ? 'bg-white text-primary-700 shadow-sm' : 'text-text-muted hover:text-primary-600'}`}
          >
            All Carpathian
          </button>
        </div>
      </div>

      <section className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-8">
        <div className="flex gap-6 h-[70vh] min-h-[500px]">
          <div className="flex-1 min-w-0 rounded-xl overflow-hidden border border-surface-muted shadow-md relative">
            <Suspense fallback={<div className="h-full w-full bg-surface-muted animate-pulse flex items-center justify-center text-text-muted">Loading map...</div>}>
              <MapView projects={projectsToFilter} />
            </Suspense>
          </div>
          <aside className="w-[380px] flex-shrink-0">
            <MapSidebar
              projects={activeProjects}
              onAddProject={() => setIsAddProjectOpen(true)}
              onVolunteer={() => setVolunteerProjectId('volunteer')}
            />
          </aside>
        </div>
      </section>

      <section className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-8">
        <div className="flex gap-2 mb-4" aria-label="View tabs">
          <button onClick={() => setActiveTab('projects')} className={`px-3 py-1 rounded text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${filters.activeTab === 'projects' ? 'bg-primary-500 text-white' : 'bg-white text-primary-500 border border-primary-500'}`} aria-pressed={filters.activeTab === 'projects'}>Projects</button>
          <button onClick={() => setActiveTab('experts')} className={`px-3 py-1 rounded text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${filters.activeTab === 'experts' ? 'bg-primary-500 text-white' : 'bg-white text-primary-500 border border-primary-500'}`} aria-pressed={filters.activeTab === 'experts'}>Experts</button>
        </div>

        <section aria-live="polite" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="status">
          {isLoading ? (
            <><SkeletonCard type="project" /><SkeletonCard type="project" /></>
          ) : (
            <>
              {filters.activeTab === 'projects' && activeProjects.map(p => (
                <ProjectCard key={p.id} {...p} onVolunteer={() => setVolunteerProjectId(p.id)} />
              ))}
              {filters.activeTab === 'experts' && activeExperts.map(e => (
                <ExpertCard key={e.id} {...e} />
              ))}
            </>
          )}
          {(!isLoading && (filters.activeTab === 'projects' ? activeProjects : activeExperts).length === 0) && (
            <div className="col-span-full text-center py-12 text-text-muted">No results match your filters.</div>
          )}
        </section>
      </section>

      <AddProjectModal isOpen={isAddProjectOpen} onClose={() => setIsAddProjectOpen(false)} onSubmit={handleAddProject} />
      {volunteerProjectId && volunteerProjectId !== 'volunteer' && (
        <VolunteerModal isOpen={!!volunteerProjectId} onClose={() => setVolunteerProjectId(null)} projectId={volunteerProjectId} onSubmit={handleVolunteer} />
      )}
      {volunteerProjectId === 'volunteer' && (
        <VolunteerModal isOpen={true} onClose={() => setVolunteerProjectId(null)} projectId={null} onSubmit={handleVolunteer} />
      )}
    </main>
  );
}
