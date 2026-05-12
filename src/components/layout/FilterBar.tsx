import { useAppStore } from '@/store/appStore';
import FilterControls from './FilterControls';

export const FilterBar = () => {
  const projects = useAppStore(s => s.data.projects);

  return (
    <section
      className="mb-6 rounded-[var(--radius-panel)] border border-[var(--color-panel-border)] bg-white/90 p-4 shadow-[var(--shadow-panel)]"
      aria-label="Project and expert filters"
    >
      <FilterControls projects={projects} idPrefix="main-filters" />
    </section>
  );
};

export default FilterBar;
