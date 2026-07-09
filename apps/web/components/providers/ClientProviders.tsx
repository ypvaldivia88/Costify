'use client';

import { ToastProvider } from '@/components/ui/Toast';
import { WebAppDataProvider } from '@/components/providers/WebAppDataProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <WebAppDataProvider>{children}</WebAppDataProvider>
    </ToastProvider>
  );
}
