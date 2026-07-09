import { useCallback, type ReactNode } from 'react';
import {
  AppDataProvider,
  mapSessionToAppDataUser,
} from '@costify/client-data';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function MobileAppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const onDenyWrite = useCallback(
    (message: string) => {
      showToast(message, 'error');
    },
    [showToast]
  );

  return (
    <AppDataProvider user={mapSessionToAppDataUser(user)} onDenyWrite={onDenyWrite}>
      {children}
    </AppDataProvider>
  );
}

export { useAppData } from '@costify/client-data';
