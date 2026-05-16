import type { DatasetMode } from '@/types/app';
import type { ExpertData } from '@/types/expert';
import type { ProjectData } from '@/types/project';

const normalizeContact = (value?: string) => value?.trim().toLowerCase();

export const getDatasetProjects = (
  dataset: DatasetMode,
  projects: ProjectData[]
): ProjectData[] => {
  return dataset === 'cs'
    ? projects.filter((project) => project.isCitizenScience === true)
    : projects;
};

export const getCitizenScienceProjectExperts = (
  projects: ProjectData[],
  experts: ExpertData[]
): ExpertData[] => {
  const csProjects = getDatasetProjects('cs', projects);
  const csExpertIds = new Set(
    csProjects
      .flatMap((project) => project.expertIds)
      .filter((id): id is string => Boolean(id))
  );
  const contactEmails = new Set(
    csProjects
      .map((project) => normalizeContact(project.contact))
      .filter((email): email is string => Boolean(email))
  );

  return experts.filter((expert) => {
    const email = normalizeContact(expert.email);
    return csExpertIds.has(expert.id) || Boolean(email && contactEmails.has(email));
  });
};

export const getDatasetExperts = (
  dataset: DatasetMode,
  projects: ProjectData[],
  experts: ExpertData[]
): ExpertData[] => {
  return dataset === 'cs'
    ? getCitizenScienceProjectExperts(projects, experts)
    : experts;
};
