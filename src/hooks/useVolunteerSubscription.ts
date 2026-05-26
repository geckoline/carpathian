import { useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import type { VolunteerFormData } from '@/components/modals/VolunteerModal';
import type { StatusMessage } from './useProjectSubmission';

export const useVolunteerSubscription = (setStatusMessage: (message: StatusMessage) => void) => {
  const isOnline = useAppStore((state) => state.isOnline);

  const submitVolunteerSubscription = useCallback(async (formData: VolunteerFormData) => {
    if (!isOnline) {
      throw new Error('You are offline. Volunteer subscriptions are disabled until your connection is restored.');
    }

    try {
      if (import.meta.env.MODE === 'static' || import.meta.env.VITE_STATIC_EXAMPLE === 'true') {
        setStatusMessage({ tone: 'success', text: 'Demo subscription received locally; no database connection is used in this static example.' });
        return;
      }

      const { apiService } = await import('@/services/apiService');
      await apiService.addVolunteerSubscription(formData);
      setStatusMessage({ tone: 'success', text: 'Volunteer subscription saved. We will match you with nearby citizen science projects.' });
    } catch (error) {
      setStatusMessage({ tone: 'error', text: 'Volunteer subscription could not be saved. Please try again.' });
      throw error;
    }
  }, [isOnline, setStatusMessage]);

  return { submitVolunteerSubscription };
};
