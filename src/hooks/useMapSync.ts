import { useAppStore } from '@/store/appStore';

export const useMapSync = () => {
  const { ui: { selectedProjectId } } = useAppStore();
  return { activeProjectId: selectedProjectId };
};

export default useMapSync;
