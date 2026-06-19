'use client';

import { useEffect } from 'react';
import { onSyncReload } from '@/lib/sync/sync-events';

export function useStorageReload(reload: () => void): void {
  useEffect(() => onSyncReload(reload), [reload]);
}
