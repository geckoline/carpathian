import { useAppStore } from '@/store/appStore';

export const OfflineBanner = () => {
  const isOnline = useAppStore(s => s.isOnline);
  if (isOnline) return null;
  return <div className="fixed top-0 left-0 right-0 bg-amber-100 text-amber-800 text-center py-2 text-sm font-medium z-50">You're offline. Demo data won't sync until reconnected.</div>;
};

export default OfflineBanner;
