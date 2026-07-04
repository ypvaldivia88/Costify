import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import type { ScopedStoragePort } from '../storage/types';
import { DEFAULT_SYNC_METADATA, type SyncMetadata } from './types';

export async function loadSyncMetadata(storage: ScopedStoragePort): Promise<SyncMetadata> {
  return storage.load(STORAGE_KEYS.syncMetadata, DEFAULT_SYNC_METADATA);
}

export async function saveSyncMetadata(
  storage: ScopedStoragePort,
  metadata: SyncMetadata
): Promise<void> {
  await storage.save(STORAGE_KEYS.syncMetadata, metadata);
}

export async function markLocalUpdated(
  storage: ScopedStoragePort,
  at = Date.now()
): Promise<SyncMetadata> {
  const metadata = await loadSyncMetadata(storage);
  const next = { ...metadata, localUpdatedAt: at };
  await saveSyncMetadata(storage, next);
  return next;
}

export function hasPendingChanges(metadata: SyncMetadata): boolean {
  return metadata.localUpdatedAt > metadata.lastSyncedAt;
}
