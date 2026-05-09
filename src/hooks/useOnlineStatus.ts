import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

export const useOnlineStatus = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const setOnlineStatus = useAppStore(s => s.setOnlineStatus);

  useEffect(() => {
    const update = () => { setOnline(navigator.onLine); setOnlineStatus(navigator.onLine); };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, [setOnlineStatus]);

  return online;
};
