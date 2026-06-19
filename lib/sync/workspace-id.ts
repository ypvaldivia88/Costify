import { STORAGE_KEYS } from '@/lib/domain/constants';
import { loadFromStorage, saveToStorage } from '@/lib/storage/local-storage';

function createWorkspaceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getWorkspaceId(): string {
  const existing = loadFromStorage<string | null>(STORAGE_KEYS.syncWorkspaceId, null);
  if (existing) return existing;

  const created = createWorkspaceId();
  saveToStorage(STORAGE_KEYS.syncWorkspaceId, created);
  return created;
}

export function setWorkspaceId(workspaceId: string): void {
  saveToStorage(STORAGE_KEYS.syncWorkspaceId, workspaceId.trim());
}
