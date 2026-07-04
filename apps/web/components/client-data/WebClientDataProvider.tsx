'use client';

import { useMemo, type ReactNode } from 'react';
import type { AppBackupInput, AppBackupV1 } from '@costify/shared/backup/backup-core';
import type { ExchangeRateSnapshot } from '@costify/shared/domain/exchange-rates';
import {
  ClientDataProvider,
  createScopedStoragePort,
  createSyncService,
  type ClientDataContextValue,
  type OnlineEvents,
  type ScopeStorage,
  type StoragePort,
  type SyncService,
  type WorkspaceDocument,
} from '@costify/client-data';
import { applyBackupToStorage } from '@/lib/backup/app-backup';
import { getStorageScope, setStorageScope } from '@/lib/storage/scoped-storage';

const webRawStorage: StoragePort = {
  async load<T>(key: string, fallback: T): Promise<T> {
    if (typeof window === 'undefined') return fallback;
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return fallback;
      return JSON.parse(saved) as T;
    } catch {
      return fallback;
    }
  },
  async save<T>(key: string, value: T): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  async getRawItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  async setRawItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  async removeRawItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

const webScopeStorage: ScopeStorage = {
  getScope: async () => getStorageScope(),
  setScope: async (tenantId) => setStorageScope(tenantId),
};

const webOnlineEvents: OnlineEvents = {
  subscribe(onOnline, onOffline) {
    if (typeof window === 'undefined') return () => undefined;
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  },
};

async function fetchExchangeSnapshot(): Promise<ExchangeRateSnapshot> {
  const response = await fetch('/api/exchange-rates', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? 'No se pudieron obtener las tasas.');
  }

  const json = (await response.json()) as {
    snapshot: ExchangeRateSnapshot;
    warning?: string;
  };

  return {
    ...json.snapshot,
    stale: json.snapshot.stale ?? Boolean(json.warning),
  };
}

async function fetchRemoteWorkspace(workspaceId: string): Promise<WorkspaceDocument | null> {
  const response = await fetch(`/api/sync?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error('No se pudo descargar los datos de la nube.');
  }

  const json = (await response.json()) as { workspace: WorkspaceDocument };
  return json.workspace;
}

async function pushWorkspace(
  syncCore: SyncService,
  workspaceId: string,
  tenantId: string,
  data: AppBackupInput,
  updatedAt: number
): Promise<WorkspaceDocument> {
  const response = await fetch('/api/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(syncCore.toWorkspacePayload(workspaceId, tenantId, data, updatedAt)),
  });

  if (response.status === 409) {
    const json = (await response.json()) as { workspace: WorkspaceDocument };
    throw Object.assign(new Error('Conflicto de sincronización.'), { remote: json.workspace });
  }

  if (!response.ok) {
    throw new Error('No se pudo subir los datos a la nube.');
  }

  const json = (await response.json()) as { workspace: WorkspaceDocument };
  return json.workspace;
}

function buildWebClientDataValue(): ClientDataContextValue {
  const storage = createScopedStoragePort(webRawStorage, webScopeStorage);
  let syncCore!: SyncService;

  syncCore = createSyncService({
    storage,
    isOnline: () => (typeof navigator !== 'undefined' ? navigator.onLine : true),
    fetchRemoteWorkspace,
    pushWorkspace: (workspaceId, tenantId, data, updatedAt) =>
      pushWorkspace(syncCore, workspaceId, tenantId, data, updatedAt),
    applyBackupToStorage: async (backup: AppBackupV1) => {
      applyBackupToStorage(backup);
    },
  });

  return {
    storage,
    sync: syncCore,
    onlineEvents: webOnlineEvents,
    fetchExchangeSnapshot,
  };
}

export function WebClientDataProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => buildWebClientDataValue(), []);
  return <ClientDataProvider value={value}>{children}</ClientDataProvider>;
}

export {
  useInventory,
  useRawMaterials,
  useGlobalCosts,
  useGlobalFund,
  useTaxSettings,
  useUnitSettings,
  useWarehouses,
  useStockMovements,
  useStockThresholds,
  useExchangeRates,
  useCloudSync,
  useStorageReload,
  useNumericField,
  useUnitCatalog,
  UnitCatalogProvider,
  ExchangeRatesProvider,
  useExchangeRatesContext,
  useOptionalExchangeRates,
  usePriceReviewAlerts,
  useActivePriceReviewAlerts,
  getTabForPriceReviewTarget,
  parseTrmiApiResponse,
  NAV_ITEMS,
  NAV_BY_ID,
} from '@costify/client-data';

export type { AppTab, NavItemMeta } from '@costify/client-data';
