import { useEffect } from 'react';
import { onSyncReload } from '@/sync/sync-events';

export function useStorageReload(reload: () => void): void {
  useEffect(() => onSyncReload(reload), [reload]);
}
