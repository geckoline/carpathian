import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useAppStore, type FilterState } from '@/store/appStore';

const defaultFilters: FilterState = {
  searchTerm: '',
  statusFilter: 'all',
  fieldFilter: 'all',
  countryFilter: 'all',
  activeTab: 'projects',
  sortKey: 'name',
  sortDirection: 'asc',
};

describe('useUrlSync', () => {
  let scrollSpy: any;

  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.pushState(null, '', '/');
    useAppStore.setState({ dataset: 'cs', filters: { ...defaultFilters } });
    vi.useFakeTimers();
    Element.prototype.scrollIntoView = () => {};
    scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    scrollSpy?.mockRestore();
  });

  const renderHook = async () => {
    await act(async () => {
      const { useUrlSync } = await import('@/hooks/useUrlSync');
      const TestComponent = () => { useUrlSync(); return null; };
      render(<TestComponent />);
    });
  };

  it('scrolls to card and adds pulse class for 3s', async () => {
    document.body.innerHTML = '<div id="project-card-test-123">Test</div>';
    window.history.pushState(null, '', '/?id=test-123');

    await renderHook();

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });

    const el = document.getElementById('project-card-test-123');
    expect(el?.classList.contains('animate-pulse-ring')).toBe(true);

    act(() => { vi.advanceTimersByTime(3000); });

    expect(el?.classList.contains('animate-pulse-ring')).toBe(false);
  });

  it('opens a project share URL by selecting the project tab, scrolling, and pulsing the project card', async () => {
    document.body.innerHTML = '<article id="project-card-p1">Project</article>';
    useAppStore.setState({ dataset: 'cs', filters: { ...defaultFilters, activeTab: 'experts' } });
    window.history.pushState(null, '', '/?dataset=all&tab=projects&card=project&id=p1#project-card-p1');

    await renderHook();

    expect(useAppStore.getState().dataset).toBe('all');
    expect(useAppStore.getState().filters.activeTab).toBe('projects');
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(document.getElementById('project-card-p1')?.classList.contains('animate-pulse-ring')).toBe(true);
  });

  it('opens an expert share URL by selecting the experts tab, scrolling, and pulsing the expert card', async () => {
    document.body.innerHTML = '<article id="expert-card-e1">Expert</article>';
    useAppStore.setState({ dataset: 'all', filters: { ...defaultFilters, activeTab: 'projects' } });
    window.history.pushState(null, '', '/?dataset=cs&tab=experts&card=expert&id=e1#expert-card-e1');

    await renderHook();

    expect(useAppStore.getState().dataset).toBe('cs');
    expect(useAppStore.getState().filters.activeTab).toBe('experts');
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(document.getElementById('expert-card-e1')?.classList.contains('animate-pulse-ring')).toBe(true);
  });

  it('retries scrolling until a shared card target renders', async () => {
    window.history.pushState(null, '', '/?tab=experts&card=expert&id=late#expert-card-late');

    await renderHook();
    expect(scrollSpy).not.toHaveBeenCalled();

    document.body.innerHTML = '<article id="expert-card-late">Late expert</article>';
    act(() => { vi.advanceTimersByTime(150); });

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(document.getElementById('expert-card-late')?.classList.contains('animate-pulse-ring')).toBe(true);
  });

  it('uses hash-only card targets as a fallback', async () => {
    document.body.innerHTML = '<article id="expert-card-hash-only">Hash expert</article>';
    window.history.pushState(null, '', '/#expert-card-hash-only');

    await renderHook();

    expect(useAppStore.getState().filters.activeTab).toBe('experts');
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });

  it('hydrates dataset and filters from URL params', async () => {
    window.history.pushState(null, '', '/?dataset=all&search=bear&status=active&field=Wildlife&country=Romania');

    await renderHook();

    expect(useAppStore.getState().dataset).toBe('all');
    expect(useAppStore.getState().filters).toEqual(expect.objectContaining({
      searchTerm: 'bear',
      statusFilter: 'active',
      fieldFilter: 'Wildlife',
      countryFilter: 'Romania',
    }));
  });

  it('writes dataset and filters back to the URL without losing selected card target', async () => {
    window.history.pushState(null, '', '/?card=project&tab=projects&id=project-1#project-card-project-1');
    await renderHook();

    act(() => {
      const store = useAppStore.getState();
      store.setDataset('all');
      store.setSearchTerm('forest');
      store.setStatusFilter('planned');
      store.setFieldFilter('Biodiversity');
      store.setCountryFilter('Poland');
    });
    await act(async () => {});
    act(() => { vi.advanceTimersByTime(300); });

    const params = new URLSearchParams(window.location.search);

    expect(params.get('id')).toBe('project-1');
    expect(params.get('card')).toBe('project');
    expect(params.get('tab')).toBe('projects');
    expect(params.get('dataset')).toBe('all');
    expect(params.get('search')).toBe('forest');
    expect(params.get('status')).toBe('planned');
    expect(params.get('field')).toBe('Biodiversity');
    expect(params.get('country')).toBe('Poland');
    expect(window.location.hash).toBe('#project-card-project-1');
  });

  it('preserves an explicit default dataset on shared card URLs', async () => {
    document.body.innerHTML = '<article id="expert-card-e1">Expert</article>';
    window.history.pushState(null, '', '/?dataset=cs&tab=experts&card=expert&id=e1#expert-card-e1');

    await renderHook();
    act(() => { vi.advanceTimersByTime(300); });

    const params = new URLSearchParams(window.location.search);
    expect(params.get('dataset')).toBe('cs');
    expect(params.get('tab')).toBe('experts');
    expect(params.get('card')).toBe('expert');
    expect(params.get('id')).toBe('e1');
    expect(window.location.hash).toBe('#expert-card-e1');
  });

  it('removes default dataset and filters from the URL', async () => {
    window.history.pushState(null, '', '/?dataset=all&search=forest&status=active&field=Water&country=Romania');
    await renderHook();

    act(() => {
      const store = useAppStore.getState();
      store.setDataset('cs');
      store.clearFilters();
    });
    await act(async () => {});
    act(() => { vi.advanceTimersByTime(300); });

    expect(window.location.search).toBe('');
  });
});
