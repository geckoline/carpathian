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

export const loadAppData = async (): Promise<AppData> => {
  const [projects, experts] = await Promise.all([
    fetchWithFallback(() => apiService.getProjects(), () => mockApi.getProjects()),
    fetchWithFallback(() => apiService.getExperts(), () => mockApi.getExperts()),
  ]);

  return {
    projects: projects.map((project) => ProjectSchema.parse(project)),
    experts: experts.map((expert) => ExpertSchema.parse(expert)),
  };
};
