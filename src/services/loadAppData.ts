import { apiService } from './apiService';
import { mockApi } from './mockApi';
import { ExpertSchema, type ExpertData } from '@/types/expert';
import { ProjectSchema, type ProjectData } from '@/types/project';

type AppData = {
  projects: ProjectData[];
  experts: ExpertData[];
};

const isEmpty = <T>(data: T[]) => data.length === 0;

const hasEmptyRelations = (items: unknown[]): boolean => {
  if (items.length === 0) return false;
  const real = items.filter(
    (p): p is Record<string, unknown> =>
      typeof p === 'object' && p !== null && 'countries' in p && 'expertIds' in p
  );
  if (real.length === 0) return false;
  return (
    real.every(p => !Array.isArray(p.countries) || p.countries.length === 0) &&
    real.every(p => !Array.isArray(p.expertIds) || p.expertIds.length === 0)
  );
};

const fetchWithFallback = async (
  fetch: () => Promise<ProjectData[] | ExpertData[]>,
  fallback: () => Promise<ProjectData[] | ExpertData[]>,
): Promise<ProjectData[] | ExpertData[]> => {
  try {
    const data = await fetch();
    if (isEmpty(data as []) || hasEmptyRelations(data as ProjectData[])) {
      console.warn('[loadAppData] Fetched data is empty or lacks countries/expertIds; using mockApi fallback');
      return fallback();
    }
    return data;
  } catch {
    return fallback();
  }
};

const parseItems = <T>(items: unknown[], schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: unknown } }, label: string): T[] => {
  const valid: T[] = [];
  for (const item of items) {
    const result = schema.safeParse(item);
    if (result.success) {
      valid.push(result.data!);
    } else {
      console.warn(`[loadAppData] Skipping invalid ${label}:`, result.error);
    }
  }
  return valid;
};

export const loadAppData = async (): Promise<AppData> => {
  const [projects, experts] = await Promise.all([
    fetchWithFallback(() => apiService.getProjects(), () => mockApi.getProjects()),
    fetchWithFallback(() => apiService.getExperts(), () => mockApi.getExperts()),
  ]);

  return {
    projects: parseItems(projects as ProjectData[], ProjectSchema, 'project'),
    experts: parseItems(experts as ExpertData[], ExpertSchema, 'expert'),
  };
};
