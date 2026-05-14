import { useEffect, useRef } from 'react';
import { useAppStore, type DatasetMode, type FilterState } from '@/store/appStore';
import { getCardAnchorId, getShareTab, type ShareCardKind } from '@/utils/cardShare';

const URL_WRITE_DELAY_MS = 250;
const SCROLL_RETRY_DELAY_MS = 100;
const MAX_SCROLL_RETRIES = 20;
const TARGET_PULSE_MS = 3000;
const statusValues: FilterState['statusFilter'][] = ['all', 'active', 'past', 'planned'];
const activeTabValues: FilterState['activeTab'][] = ['projects', 'experts'];
const cardValues: ShareCardKind[] = ['project', 'expert'];

const isDatasetMode = (value: string | null): value is DatasetMode => value === 'cs' || value === 'all';
const isStatusFilter = (value: string | null): value is FilterState['statusFilter'] => {
  return value !== null && statusValues.includes(value as FilterState['statusFilter']);
};
const isActiveTab = (value: string | null): value is FilterState['activeTab'] =>
  value !== null && activeTabValues.includes(value as FilterState['activeTab']);
const isCardKind = (value: string | null): value is ShareCardKind =>
  value !== null && cardValues.includes(value as ShareCardKind);

const setParam = (params: URLSearchParams, key: string, value: string, defaultValue: string) => {
  if (value && value !== defaultValue) {
    params.set(key, value);
    return;
  }

  params.delete(key);
};

const replaceSearch = (params: URLSearchParams) => {
  const query = params.toString();
  const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  history.replaceState(null, '', newUrl);
};

const getHashTarget = () => {
  const elementId = decodeURIComponent(window.location.hash.replace(/^#/, ''));
  if (elementId.startsWith('project-card-')) return { elementId, card: 'project' as const };
  if (elementId.startsWith('expert-card-')) return { elementId, card: 'expert' as const };
  return null;
};

const getShareTarget = (params: URLSearchParams) => {
  const hashTarget = getHashTarget();
  const id = params.get('id');
  const card = isCardKind(params.get('card')) ? params.get('card') as ShareCardKind : hashTarget?.card;
  const inferredCard = card ?? (id ? 'project' : undefined);
  const elementId = hashTarget?.elementId ?? (id && inferredCard ? getCardAnchorId(inferredCard, id) : null);
  const tab = isActiveTab(params.get('tab'))
    ? params.get('tab') as FilterState['activeTab']
    : inferredCard ? getShareTab(inferredCard) : undefined;

  return elementId ? { elementId, tab } : null;
};

export const useUrlSync = () => {
  const writeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const scrollRetryTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
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
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const scrollToTarget = (elementId: string, attempt = 0) => {
    const el = document.getElementById(elementId);

    if (!el) {
      if (attempt >= MAX_SCROLL_RETRIES) return;
      scrollRetryTimeoutRef.current = setTimeout(() => {
        scrollToTarget(elementId, attempt + 1);
      }, SCROLL_RETRY_DELAY_MS);
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('animate-pulse-ring');

    pulseTimeoutRef.current = setTimeout(() => {
      el.classList.remove('animate-pulse-ring');
    }, TARGET_PULSE_MS);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const datasetParam = params.get('dataset');
    const searchParam = params.get('search');
    const statusParam = params.get('status');
    const fieldParam = params.get('field');
    const countryParam = params.get('country');
    const target = getShareTarget(params);

    if (isDatasetMode(datasetParam)) setDataset(datasetParam);
    if (searchParam !== null) setSearchTerm(searchParam);
    if (isStatusFilter(statusParam)) setStatusFilter(statusParam);
    if (fieldParam) setFieldFilter(fieldParam);
    if (countryParam) setCountryFilter(countryParam);
    if (target?.tab) setActiveTab(target.tab);

    hasHydratedRef.current = true;
    if (!target) return;

    scrollToTarget(target.elementId);

    return () => {
      if (scrollRetryTimeoutRef.current) clearTimeout(scrollRetryTimeoutRef.current);
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    };
  }, [setActiveTab, setCountryFilter, setDataset, setFieldFilter, setSearchTerm, setStatusFilter]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;

    writeTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const shouldPreserveShareDataset = Boolean(
        params.get('card') ||
        params.get('id') ||
        params.get('tab') ||
        getHashTarget()
      );
      setParam(params, 'dataset', dataset, shouldPreserveShareDataset ? '' : 'cs');
      setParam(params, 'search', searchTerm, '');
      setParam(params, 'status', statusFilter, 'all');
      setParam(params, 'field', fieldFilter, 'all');
      setParam(params, 'country', countryFilter, 'all');
      replaceSearch(params);
    }, URL_WRITE_DELAY_MS);

    return () => {
      if (writeTimeoutRef.current) clearTimeout(writeTimeoutRef.current);
    };
  }, [countryFilter, dataset, fieldFilter, searchTerm, statusFilter]);

  const updateUrl = (id: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (id) params.set('id', id); else params.delete('id');
    replaceSearch(params);
  };

  return { updateUrl };
};
