'use client';

import { AppShell } from '@/components/layout/AppShell';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';

export default function Home() {
  return (
    <ConfirmProvider>
      <AppShell />
    </ConfirmProvider>
  );
}
