import { z } from 'zod';
import { ProjectData, ProjectSchema } from '@/types/project';
import { ExpertData, ExpertSchema } from '@/types/expert';
import { mockApi } from './mockApi';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchValidated<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  return schema.parse(json);
}

async function fetchWithRetry<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fetchValidated(url, schema);
    } catch (err) {
      lastError = err;
      if (i < MAX_RETRIES - 1) await delay(RETRY_DELAY_MS * (i + 1));
    }
  }
  throw lastError;
}

export const apiService = {
  async getProjects(): Promise<ProjectData[]> {
    const base = import.meta.env.VITE_API_BASE_URL;
    if (!base) return mockApi.getProjects();
    return fetchWithRetry(`${base}/projects`, z.array(ProjectSchema));
  },
  async getProject(id: string): Promise<ProjectData | null> {
    const base = import.meta.env.VITE_API_BASE_URL;
    if (!base) return mockApi.getProject(id);
    try { return await fetchWithRetry(`${base}/projects/${id}`, ProjectSchema); }
    catch { return null; }
  },
  async getExperts(): Promise<ExpertData[]> {
    const base = import.meta.env.VITE_API_BASE_URL;
    if (!base) return mockApi.getExperts();
    return fetchWithRetry(`${base}/experts`, z.array(ExpertSchema));
  },
  async getExpert(id: string): Promise<ExpertData | null> {
    const base = import.meta.env.VITE_API_BASE_URL;
    if (!base) return mockApi.getExpert(id);
    try { return await fetchWithRetry(`${base}/experts/${id}`, ExpertSchema); }
    catch { return null; }
  },
};
