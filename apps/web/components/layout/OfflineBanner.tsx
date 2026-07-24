'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div
      role="status"
      className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs sm:text-sm text-amber-900 dark:text-amber-100"
    >
      <span className="inline-flex items-center justify-center gap-2 font-medium">
        <WifiOff className="size-4 shrink-0" aria-hidden />
        Sin conexión — trabajando con datos guardados en este dispositivo
      </span>
    </div>
  );
}
