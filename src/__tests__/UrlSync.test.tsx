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

  it('writes dataset and filters back to the URL without losing selected id', async () => {
    window.history.pushState(null, '', '/?id=project-1');
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
    expect(params.get('dataset')).toBe('all');
    expect(params.get('search')).toBe('forest');
    expect(params.get('status')).toBe('planned');
    expect(params.get('field')).toBe('Biodiversity');
    expect(params.get('country')).toBe('Poland');
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
