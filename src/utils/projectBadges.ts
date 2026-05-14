import type { ProjectData } from '@/types/project';

type ProjectStatus = ProjectData['status'];

const statusLabels: Record<ProjectStatus, string> = {
  active: 'Active',
  planned: 'Planned',
  past: 'Past',
};

const compactCategoryLabels: Record<string, string> = {
  'industry & infrastructure': 'Infrastructure',
  'industry, energy, transport & infrastructure': 'Infrastructure',
  'awareness & education': 'Education',
  'cultural heritage & traditional knowledge': 'Cultural Heritage',
};

export const getProjectStatusLabel = (status: ProjectStatus) => statusLabels[status] ?? status;

export const getCompactCategoryLabel = (field: string) =>
  compactCategoryLabels[field.trim().toLowerCase()] ?? field;
