import { useCallback } from 'react';
import type { ProjectFormData } from '@/components/modals/AddProjectModal';
import { apiService } from '@/services/apiService';
import { useAppStore } from '@/store/appStore';
import { getCategoryLabel, normalizeCategoryId } from '@/utils/categories';

export type StatusMessage = { tone: 'success' | 'warning' | 'error'; text: string };

const DEFAULT_CENTER = { lat: 47.5, lng: 25 };

const toGeometryWkt = (areaCoords?: [number, number][]) => {
  if (!areaCoords || areaCoords.length < 3) {
    return `geometry('POINT(${DEFAULT_CENTER.lng} ${DEFAULT_CENTER.lat})', 4326)`;
  }

  const coords = areaCoords.map(([lat, lng]) => `${lng.toFixed(4)} ${lat.toFixed(4)}`).join(', ');
  const [firstLat, firstLng] = areaCoords[0];
  return `geometry('POLYGON((${coords}, ${firstLng.toFixed(4)} ${firstLat.toFixed(4)}))', 4326)`;
};

export const useProjectSubmission = (setStatusMessage: (message: StatusMessage) => void) => {
  const isOnline = useAppStore((state) => state.isOnline);
  const addProject = useAppStore((state) => state.addProject);
  const experts = useAppStore((state) => state.data.experts);

  const submitProject = useCallback(async (formData: ProjectFormData) => {
    if (!isOnline) {
      throw new Error('You are offline. Project submissions are disabled until your connection is restored.');
    }

    const categoryId = normalizeCategoryId(formData.field) ?? 'biodiversity';
    const leadExpert = experts.find((expert) => expert.id === formData.leadExpertId);
    if (!leadExpert) {
      throw new Error('Select an existing leading expert before submitting the project.');
    }

    const projectDraft = {
      ...formData,
      categoryId,
      field: getCategoryLabel(categoryId),
      leadExpertId: leadExpert.id,
      leadExpertName: leadExpert.name,
      location: toGeometryWkt(formData.areaCoords),
      displayLocation: formData.location,
      regionLabel: formData.location,
      lat: DEFAULT_CENTER.lat,
      lng: DEFAULT_CENTER.lng,
    };

    try {
      await apiService.addProject(projectDraft);
      setStatusMessage({ tone: 'success', text: 'Project added successfully.' });
    } catch {
      setStatusMessage({ tone: 'warning', text: 'Project saved locally; remote sync is currently unavailable.' });
    }

    addProject(projectDraft);
  }, [addProject, experts, isOnline, setStatusMessage]);

  return { submitProject };
};
