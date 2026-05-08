import { useAppStore } from '@/store/appStore';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

export const StatsSection = () => {
  const { data } = useAppStore();
  const activeProjects = data.projects.filter(p => p.status === 'active').length;

  return (
    <section className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Platform statistics">
      <div className="p-4 bg-white rounded-lg shadow-sm border border-surface-muted">
        <p className="text-xs text-text-muted uppercase tracking-wide">Total Projects</p>
        <p className="text-3xl font-bold text-primary-700 mt-1" data-testid="stat-projects">
          <AnimatedCounter target={data.projects.length} />
        </p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow-sm border border-surface-muted">
        <p className="text-xs text-text-muted uppercase tracking-wide">Active Now</p>
        <p className="text-3xl font-bold text-status-active mt-1" data-testid="stat-active">
          <AnimatedCounter target={activeProjects} />
        </p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow-sm border border-surface-muted">
        <p className="text-xs text-text-muted uppercase tracking-wide">Experts</p>
        <p className="text-3xl font-bold text-primary-600 mt-1" data-testid="stat-experts">
          <AnimatedCounter target={data.experts.length} />
        </p>
      </div>
    </section>
  );
};

export default StatsSection;
