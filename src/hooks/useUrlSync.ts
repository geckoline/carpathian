import { useEffect, useRef } from 'react';
import { useAppStore, type DatasetMode, type FilterState } from '@/store/appStore';

const URL_WRITE_DELAY_MS = 250;
const statusValues: FilterState['statusFilter'][] = ['all', 'active', 'past', 'planned'];

const isDatasetMode = (value: string | null): value is DatasetMode => value === 'cs' || value === 'all';
const isStatusFilter = (value: string | null): value is FilterState['statusFilter'] => {
  return value !== null && statusValues.includes(value as FilterState['statusFilter']);
};

const setParam = (params: URLSearchParams, key: string, value: string, defaultValue: string) => {
  if (value && value !== defaultValue) {
    params.set(key, value);
    return;
  }

  params.delete(key);
};

const replaceSearch = (params: URLSearchParams) => {
  const query = params.toString();
  const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  history.replaceState(null, '', newUrl);
};

export const useUrlSync = () => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hasHydratedRef = useRef(false);
  const dataset = useAppStore((state) => state.dataset);
  const searchTerm = useAppStore((state) => state.filters.searchTerm);
  const statusFilter = useAppStore((state) => state.filters.statusFilter);
  const fieldFilter = useAppStore((state) => state.filters.fieldFilter);
  const countryFilter = useAppStore((state) => state.filters.countryFilter);
  const setDataset = useAppStore((state) => state.setDataset);
  const setSearchTerm = useAppStore((state) => state.setSearchTerm);
  const setStatusFilter = useAppStore((state) => state.setStatusFilter);
  const setFieldFilter = useAppStore((state) => state.setFieldFilter);
  const setCountryFilter = useAppStore((state) => state.setCountryFilter);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const datasetParam = params.get('dataset');
    const searchParam = params.get('search');
    const statusParam = params.get('status');
    const fieldParam = params.get('field');
    const countryParam = params.get('country');

    if (isDatasetMode(datasetParam)) setDataset(datasetParam);
    if (searchParam !== null) setSearchTerm(searchParam);
    if (isStatusFilter(statusParam)) setStatusFilter(statusParam);
    if (fieldParam) setFieldFilter(fieldParam);
    if (countryParam) setCountryFilter(countryParam);

    const id = params.get('id');
    hasHydratedRef.current = true;
    if (!id) return;

    const el = document.getElementById(`project-card-${id}`);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('animate-pulse-ring');

    timeoutRef.current = setTimeout(() => {
      el.classList.remove('animate-pulse-ring');
    }, 3000);

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [setCountryFilter, setDataset, setFieldFilter, setSearchTerm, setStatusFilter]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;

    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setParam(params, 'dataset', dataset, 'cs');
      setParam(params, 'search', searchTerm, '');
      setParam(params, 'status', statusFilter, 'all');
      setParam(params, 'field', fieldFilter, 'all');
      setParam(params, 'country', countryFilter, 'all');
      replaceSearch(params);
    }, URL_WRITE_DELAY_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [countryFilter, dataset, fieldFilter, searchTerm, statusFilter]);

  const updateUrl = (id: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (id) params.set('id', id); else params.delete('id');
    replaceSearch(params);
  };

  return { updateUrl };
};
