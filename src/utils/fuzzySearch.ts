import Fuse, { type IFuseOptions } from 'fuse.js';
import type { ExpertData } from '@/types/expert';
import type { ProjectData } from '@/types/project';

const normalizeSearchTerm = (searchTerm: string) => searchTerm.trim();

const fuseCache = new Map<object, Fuse<unknown>>();

const getCachedFuse = <T>(items: T[], options: IFuseOptions<T>): Fuse<T> => {
  const cached = fuseCache.get(items as object) as Fuse<T> | undefined;
  if (cached) return cached;
  const fuse = new Fuse(items, { includeScore: true, ignoreLocation: true, minMatchCharLength: 2, threshold: 0.38, ...options });
  fuseCache.set(items as object, fuse as Fuse<unknown>);
  return fuse;
};

const filterWithFuse = <T>(items: T[], searchTerm: string, options: IFuseOptions<T>) => {
  const term = normalizeSearchTerm(searchTerm);
  if (!term) return items;

  const fuse = getCachedFuse(items, options);
  return fuse.search(term).map((result) => result.item);
};

export const filterProjectsBySearch = (projects: ProjectData[], searchTerm: string) => filterWithFuse(projects, searchTerm, {
  keys: [
    { name: 'name', weight: 0.28 },
    { name: 'leadExpertName', weight: 0.16 },
    { name: 'field', weight: 0.12 },
    { name: 'country', weight: 0.1 },
    { name: 'displayLocation', weight: 0.1 },
    { name: 'regionLabel', weight: 0.1 },
    { name: 'description', weight: 0.08 },
    { name: 'cardSummary', weight: 0.08 },
    { name: 'focusSummary', weight: 0.04 },
    { name: 'outputsSummary', weight: 0.04 },
  ],
});

export const filterExpertsBySearch = (experts: ExpertData[], searchTerm: string) => filterWithFuse(experts, searchTerm, {
  keys: [
    { name: 'name', weight: 0.26 },
    { name: 'institution', weight: 0.16 },
    { name: 'headline', weight: 0.14 },
    { name: 'expertiseSubtitle', weight: 0.10 },
    { name: 'expertise', weight: 0.10 },
    { name: 'country', weight: 0.08 },
    { name: 'email', weight: 0.08 },
    { name: 'bio', weight: 0.08 },
  ],
});
