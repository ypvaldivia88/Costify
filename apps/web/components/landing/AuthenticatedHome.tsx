'use client';

import { AppShell } from '@/components/layout/AppShell';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';

export function AuthenticatedHome() {
  return (
    <ConfirmProvider>
      <AppShell />
    </ConfirmProvider>
  );
}
