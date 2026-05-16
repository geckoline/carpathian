import { useMemo, memo } from 'react';
import type { ProjectData } from '@/types/project';
import type { ExpertData } from '@/types/expert';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

export const StatsSection = memo(({ projects, experts }: { projects: ProjectData[]; experts: ExpertData[] }) => {
  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const countries = [...new Set(projects.flatMap(p => p.countries ?? []).filter(Boolean))].length;
    return [
      { id: 'projects', label: 'Total Projects', value: projects.length },
      { id: 'active', label: 'Active Projects', value: activeProjects },
      { id: 'countries', label: 'Countries', value: countries },
      { id: 'experts', label: 'Experts', value: experts.length },
    ];
  }, [projects, experts]);

  return (
    <section className="mb-4 sm:mb-6" aria-label="Platform statistics">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" data-testid="stats-grid">
        {stats.map((stat) => (
          <div
            key={stat.id}
            data-testid={`stat-card-${stat.id}`}
            className="relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-soft-border)] bg-[var(--color-panel-surface)] p-4 text-center shadow-[var(--shadow-panel)] transition-all duration-500 sm:p-6 sm:hover:-translate-y-2 sm:hover:shadow-[var(--shadow-surface)]"
          >
            <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#006633] to-[#00a050] sm:h-2" />
            <p className="mb-1 bg-gradient-to-r from-[#006633] to-[#008040] bg-clip-text text-2xl sm:text-4xl font-extrabold text-transparent sm:mb-2" data-testid={`stat-${stat.id}`}>
              <AnimatedCounter target={stat.value} />
            </p>
            <p className="text-xs font-semibold leading-tight text-[var(--color-field-note)] sm:text-lg">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
});

export default StatsSection;
