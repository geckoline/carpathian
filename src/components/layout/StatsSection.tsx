import type { ProjectData } from '@/types/project';
import type { ExpertData } from '@/types/expert';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

export const StatsSection = ({ projects, experts }: { projects: ProjectData[]; experts: ExpertData[] }) => {
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const countries = [...new Set(projects.map(p => p.country).filter(Boolean))].length;

  return (
    <section className="mb-6" aria-label="Platform statistics">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative bg-white rounded-2xl shadow-md border border-[#c8e6c9]/70 p-6 text-center overflow-hidden hover:-translate-y-2 hover:shadow-lg transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#006633] to-[#00a050]" />
          <p className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-[#006633] to-[#008040] bg-clip-text text-transparent" data-testid="stat-projects">
            <AnimatedCounter target={projects.length} />
          </p>
          <p className="text-lg font-semibold text-[#666]">Total Projects</p>
        </div>
        <div className="relative bg-white rounded-2xl shadow-md border border-[#c8e6c9]/70 p-6 text-center overflow-hidden hover:-translate-y-2 hover:shadow-lg transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#006633] to-[#00a050]" />
          <p className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-[#006633] to-[#008040] bg-clip-text text-transparent" data-testid="stat-active">
            <AnimatedCounter target={activeProjects} />
          </p>
          <p className="text-lg font-semibold text-[#666]">Active Projects</p>
        </div>
        <div className="relative bg-white rounded-2xl shadow-md border border-[#c8e6c9]/70 p-6 text-center overflow-hidden hover:-translate-y-2 hover:shadow-lg transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#006633] to-[#00a050]" />
          <p className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-[#006633] to-[#008040] bg-clip-text text-transparent" data-testid="stat-countries">
            <AnimatedCounter target={countries} />
          </p>
          <p className="text-lg font-semibold text-[#666]">Countries</p>
        </div>
        <div className="relative bg-white rounded-2xl shadow-md border border-[#c8e6c9]/70 p-6 text-center overflow-hidden hover:-translate-y-2 hover:shadow-lg transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#006633] to-[#00a050]" />
          <p className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-[#006633] to-[#008040] bg-clip-text text-transparent" data-testid="stat-experts">
            <AnimatedCounter target={experts.length} />
          </p>
          <p className="text-lg font-semibold text-[#666]">Experts</p>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
