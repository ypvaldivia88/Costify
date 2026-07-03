import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { loadFromStorage, saveToStorage } from '@/lib/storage/local-storage';

export interface SyncMetadata {
  lastSyncedAt: number;
  localUpdatedAt: number;
}

const DEFAULT_METADATA: SyncMetadata = {
  lastSyncedAt: 0,
  localUpdatedAt: 0,
};

export function loadSyncMetadata(): SyncMetadata {
  return loadFromStorage(STORAGE_KEYS.syncMetadata, DEFAULT_METADATA);
}

export function saveSyncMetadata(metadata: SyncMetadata): void {
  saveToStorage(STORAGE_KEYS.syncMetadata, metadata);
}

export function markLocalUpdated(at = Date.now()): SyncMetadata {
  const metadata = loadSyncMetadata();
  const next = { ...metadata, localUpdatedAt: at };
  saveSyncMetadata(next);
  return next;
}

export function hasPendingChanges(metadata = loadSyncMetadata()): boolean {
  return metadata.localUpdatedAt > metadata.lastSyncedAt;
}
