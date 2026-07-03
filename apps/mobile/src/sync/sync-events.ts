type SyncReloadListener = () => void;

const listeners = new Set<SyncReloadListener>();

export function notifySyncReload(): void {
  listeners.forEach((listener) => listener());
}

export function onSyncReload(handler: SyncReloadListener): () => void {
  listeners.add(handler);
  return () => listeners.delete(handler);
}
