import { apiService } from './apiService';
import { mockApi } from './mockApi';
import { ExpertSchema, type ExpertData } from '@/types/expert';
import { ProjectSchema, type ProjectData } from '@/types/project';

type AppData = {
  projects: ProjectData[];
  experts: ExpertData[];
};

const isEmpty = <T>(data: T[]) => data.length === 0;

const fetchWithFallback = async <T>(
  fetch: () => Promise<T[]>,
  fallback: () => Promise<T[]>
): Promise<T[]> => {
  try {
    const data = await fetch();
    return isEmpty(data) ? fallback() : data;
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
    projects: parseItems(projects, ProjectSchema, 'project'),
    experts: parseItems(experts, ExpertSchema, 'expert'),
  };
};
