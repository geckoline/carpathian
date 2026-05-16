import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WizardShell } from './AddProjectWizard/WizardShell';
import { BasicsStep } from './AddProjectWizard/steps/BasicsStep';
import { ExpertStep } from './AddProjectWizard/steps/ExpertStep';
import { LocationStep } from './AddProjectWizard/steps/LocationStep';
import { DetailsStep } from './AddProjectWizard/steps/DetailsStep';
import { ReviewStep } from './AddProjectWizard/steps/ReviewStep';
import type { WizardFormData } from './AddProjectWizard/wizardTypes';
import { wizardSchema, WIZARD_STEPS, DRAFT_STORAGE_KEY } from './AddProjectWizard/wizardTypes';
import { geocodeLocation, getCountriesFromText, reverseGeocode } from '@/utils/geocoding';

export type ProjectFormData = WizardFormData;

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  isOnline?: boolean;
}

export const AddProjectModal = ({ isOpen, onClose, onSubmit, isOnline = true }: AddProjectModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const detectedCountries = useRef<string[]>([]);

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: loadDraft() ?? {
      name: '',
      status: 'planned',
      field: 'biodiversity',
      description: '',
      expertIds: [],
      location: '',
      areaCoords: undefined,
      areaMode: 'simple',
      yearRange: `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
      countries: [],
    },
  });

  const { handleSubmit, getValues, reset, setValue, watch, formState: { isSubmitting } } = form;
  const locationValue = watch('location');
  const areaCoordsValue = watch('areaCoords');

  useEffect(() => {
    if (!locationValue) return;
    if (areaCoordsValue && areaCoordsValue.length > 0) return;
    const localMatch = getCountriesFromText(locationValue);
    if (localMatch.length > 0) {
      detectedCountries.current = localMatch;
      return;
    }
    const timer = setTimeout(async () => {
      const result = await geocodeLocation(locationValue);
      if (result?.countryCode) {
        detectedCountries.current = [result.countryCode];
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [locationValue, areaCoordsValue]);

  useEffect(() => {
    if (!areaCoordsValue || areaCoordsValue.length === 0) return;
    const [lat, lng] = areaCoordsValue.length >= 3
      ? centroid(areaCoordsValue)
      : [areaCoordsValue[0]![0], areaCoordsValue[0]![1]];
    const timer = setTimeout(async () => {
      const countryCode = await reverseGeocode(lat, lng);
      if (countryCode) {
        detectedCountries.current = [countryCode];
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [areaCoordsValue]);

  useEffect(() => {
    if (isOpen) {
      const draft = loadDraft();
      if (draft) reset(draft);
      setCurrentStep(0);
      setSubmitError(null);
      detectedCountries.current = [];
    }
  }, [isOpen, reset]);

  const handleNext = useCallback(() => {
    saveDraft(getValues());
    if (currentStep === 2 && detectedCountries.current.length > 0) {
      setValue('countries', detectedCountries.current, { shouldDirty: true });
    }
    setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  }, [getValues, currentStep, setValue]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    reset({
      name: '',
      status: 'planned',
      field: 'biodiversity',
      description: '',
      expertIds: [],
      location: '',
      areaCoords: undefined,
      areaMode: 'simple',
      yearRange: `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
      countries: [],
    });
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setCurrentStep(0);
    setSubmitError(null);
    detectedCountries.current = [];
  }, [reset]);

  const handleClose = useCallback(() => {
    setSubmitError(null);
    onClose();
  }, [onClose]);

  const handleFinalSubmit = useCallback(async (data: WizardFormData) => {
    try {
      setSubmitError(null);
      await onSubmit(data);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      handleClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Project could not be saved. Please try again.');
    }
  }, [onSubmit, handleClose]);

  const canGoNext = useMemo(() => {
    if (currentStep === WIZARD_STEPS.length - 1) return true;
    return true;
  }, [currentStep]);

  const currentStepComponent = useMemo(() => {
    switch (currentStep) {
      case 0: return <BasicsStep />;
      case 1: return <ExpertStep />;
      case 2: return <LocationStep />;
      case 3: return <DetailsStep />;
      case 4: return <ReviewStep />;
      default: return null;
    }
  }, [currentStep]);

  return (
    <FormProvider {...form}>
      <WizardShell
        isOpen={isOpen}
        onClose={handleClose}
        title="Add New Project"
        currentStep={currentStep}
        steps={[...WIZARD_STEPS]}
        onNext={handleNext}
        onBack={handleBack}
        canGoNext={canGoNext}
        isSubmitting={isSubmitting}
        isOnline={isOnline}
        submitError={submitError}
        onReset={handleReset}
        submitTestId="add-project-submit"
        onSubmit={handleSubmit(handleFinalSubmit)}
      >
        {currentStepComponent}
      </WizardShell>
    </FormProvider>
  );
};

function loadDraft(): WizardFormData | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WizardFormData;
  } catch {
    return null;
  }
}

function saveDraft(data: WizardFormData) {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded, silently fail */
  }
}

function centroid(coords: [number, number][]): [number, number] {
  const n = coords.length;
  return [
    coords.reduce((s, c) => s + c[0], 0) / n,
    coords.reduce((s, c) => s + c[1], 0) / n,
  ];
}

export default AddProjectModal;
