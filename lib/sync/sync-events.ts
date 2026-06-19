export const SYNC_RELOAD_EVENT = 'costify:sync-reload';

export function notifySyncReload(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SYNC_RELOAD_EVENT));
}

export function onSyncReload(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(SYNC_RELOAD_EVENT, handler);
  return () => window.removeEventListener(SYNC_RELOAD_EVENT, handler);
}
