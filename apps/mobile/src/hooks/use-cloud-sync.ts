import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppBackupInput } from '@/backup/app-backup';
import {
  hasPendingChanges,
  loadSyncMetadata,
  markLocalUpdated,
} from '@/sync/sync-metadata';
import {
  isOnline,
  syncWithCloud,
  type SyncDirection,
  type SyncStatus,
} from '@/sync/sync-service';

const AUTO_SYNC_DEBOUNCE_MS = 2500;

interface UseCloudSyncOptions {
  enabled: boolean;
  data: AppBackupInput;
  tenantId?: string;
  workspaceId?: string;
}

export function useCloudSync({ enabled, data, tenantId, workspaceId }: UseCloudSyncOptions) {
  const [status, setStatus] = useState<SyncStatus>(() => (isOnline() ? 'idle' : 'offline'));
  const [direction, setDirection] = useState<SyncDirection>('none');
  const [lastSyncedAt, setLastSyncedAt] = useState(0);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [displayWorkspaceId, setDisplayWorkspaceId] = useState('');
  const initialSyncDone = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncingRef = useRef(false);
  const dataSnapshot = useRef('');
  const suppressDirtyUntil = useRef(0);

  const refreshMetadata = useCallback(async () => {
    const metadata = await loadSyncMetadata();
    setLastSyncedAt(metadata.lastSyncedAt);
    setPending(hasPendingChanges(metadata));
  }, []);

  const runSync = useCallback(async () => {
    if (!enabled || syncingRef.current || !tenantId || !workspaceId) return;

    syncingRef.current = true;
    setStatus(isOnline() ? 'syncing' : 'offline');
    setErrorMessage(null);

    const result = await syncWithCloud(workspaceId, tenantId);

    if (result.direction === 'pull') {
      suppressDirtyUntil.current = Date.now() + 800;
    }

    syncingRef.current = false;
    setStatus(result.status);
    setDirection(result.direction);
    setErrorMessage(result.message ?? null);
    setDisplayWorkspaceId(workspaceId);
    await refreshMetadata();
  }, [enabled, refreshMetadata, tenantId, workspaceId]);

  useEffect(() => {
    if (workspaceId) setDisplayWorkspaceId(workspaceId);
    void refreshMetadata();
  }, [workspaceId, refreshMetadata]);

  useEffect(() => {
    if (!enabled) return;

    if (!initialSyncDone.current) return;

    const snapshot = JSON.stringify(data);
    if (snapshot === dataSnapshot.current) return;

    if (Date.now() < suppressDirtyUntil.current) {
      dataSnapshot.current = snapshot;
      void refreshMetadata();
      return;
    }

    dataSnapshot.current = snapshot;
    void markLocalUpdated().then(() => refreshMetadata());

    if (!isOnline()) {
      setStatus('offline');
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void runSync();
    }, AUTO_SYNC_DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [data, enabled, refreshMetadata, runSync]);

  useEffect(() => {
    if (!enabled || initialSyncDone.current) return;

    dataSnapshot.current = JSON.stringify(data);
    initialSyncDone.current = true;

    void runSync();
  }, [data, enabled, runSync]);

  return {
    status,
    direction,
    pending,
    lastSyncedAt,
    errorMessage,
    workspaceId: displayWorkspaceId,
    isOnline: status !== 'offline',
    syncNow: runSync,
    refreshMetadata,
  };
}
