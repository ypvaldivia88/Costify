'use client';

import { useCallback } from 'react';
import {
  AppDataProvider,
  mapSessionToAppDataUser,
} from '@costify/client-data';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';

export function WebAppDataProvider({ children }: { children: React.ReactNode }) {
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
