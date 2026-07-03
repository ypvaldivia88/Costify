import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { loadFromStorage, saveToStorage } from '@/storage/async-storage';

export interface SyncMetadata {
  lastSyncedAt: number;
  localUpdatedAt: number;
}

const DEFAULT_METADATA: SyncMetadata = {
  lastSyncedAt: 0,
  localUpdatedAt: 0,
};

export async function loadSyncMetadata(): Promise<SyncMetadata> {
  return loadFromStorage(STORAGE_KEYS.syncMetadata, DEFAULT_METADATA);
}

export async function saveSyncMetadata(metadata: SyncMetadata): Promise<void> {
  await saveToStorage(STORAGE_KEYS.syncMetadata, metadata);
}

export async function markLocalUpdated(at = Date.now()): Promise<SyncMetadata> {
  const metadata = await loadSyncMetadata();
  const next = { ...metadata, localUpdatedAt: at };
  await saveSyncMetadata(next);
  return next;
}

export function hasPendingChanges(metadata: SyncMetadata): boolean {
  return metadata.localUpdatedAt > metadata.lastSyncedAt;
}
