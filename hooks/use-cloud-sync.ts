'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppBackupInput } from '@/lib/backup/app-backup';
import {
  hasPendingChanges,
  loadSyncMetadata,
  markLocalUpdated,
} from '@/lib/sync/sync-metadata';
import {
  isOnline,
  syncWithCloud,
  type SyncDirection,
  type SyncStatus,
} from '@/lib/sync/sync-service';
import { getWorkspaceId } from '@/lib/sync/workspace-id';

const AUTO_SYNC_DEBOUNCE_MS = 2500;

interface UseCloudSyncOptions {
  enabled: boolean;
  data: AppBackupInput;
}

export function useCloudSync({ enabled, data }: UseCloudSyncOptions) {
  const [status, setStatus] = useState<SyncStatus>(() => (isOnline() ? 'idle' : 'offline'));
  const [direction, setDirection] = useState<SyncDirection>('none');
  const [lastSyncedAt, setLastSyncedAt] = useState(0);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [workspaceId, setWorkspaceIdState] = useState('');
  const initialSyncDone = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncingRef = useRef(false);
  const dataSnapshot = useRef('');
  const suppressDirtyUntil = useRef(0);

  const refreshMetadata = useCallback(() => {
    const metadata = loadSyncMetadata();
    setLastSyncedAt(metadata.lastSyncedAt);
    setPending(hasPendingChanges(metadata));
  }, []);

  const runSync = useCallback(async () => {
    if (!enabled || syncingRef.current) return;

    syncingRef.current = true;
    setStatus(isOnline() ? 'syncing' : 'offline');
    setErrorMessage(null);

    const result = await syncWithCloud(getWorkspaceId());

    if (result.direction === 'pull') {
      suppressDirtyUntil.current = Date.now() + 800;
    }

    syncingRef.current = false;
    setStatus(result.status);
    setDirection(result.direction);
    setErrorMessage(result.message ?? null);
    setWorkspaceIdState(getWorkspaceId());
    refreshMetadata();
  }, [enabled, refreshMetadata]);

  useEffect(() => {
    setWorkspaceIdState(getWorkspaceId());
    refreshMetadata();
  }, [refreshMetadata]);

  useEffect(() => {
    if (!enabled) return;

    const onOnline = () => {
      setStatus('idle');
      void runSync();
    };
    const onOffline = () => setStatus('offline');

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [enabled, runSync]);

  useEffect(() => {
    if (!enabled || !initialSyncDone.current) return;

    const snapshot = JSON.stringify(data);
    if (snapshot === dataSnapshot.current) return;

    if (Date.now() < suppressDirtyUntil.current) {
      dataSnapshot.current = snapshot;
      refreshMetadata();
      return;
    }

    dataSnapshot.current = snapshot;
    markLocalUpdated();
    refreshMetadata();

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

    void (async () => {
      await runSync();
    })();
  }, [data, enabled, runSync]);

  return {
    status,
    direction,
    pending,
    lastSyncedAt,
    errorMessage,
    workspaceId,
    isOnline: status !== 'offline',
    syncNow: runSync,
    refreshMetadata,
  };
}
