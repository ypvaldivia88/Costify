import { useMemo, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { apiFetch } from '@/api/client';
import { fetchEltoqueRates } from '@/api/eltoque';
import { applyBackupToStorage } from '@/backup/app-backup';
import { hasBackendApi, hasDirectEltoqueAccess } from '@/config/env';
import {
  ensureConnectivityMonitoring,
  isDeviceOnline,
  probeConnectivity,
  subscribeConnectivity,
} from '@/config/connectivity';
import { loadStorageScope, setStorageScope } from '@/storage/scoped-storage';

const MANUAL_ONLY_ERROR =
  'No se pudieron obtener las tasas. Ingresa las tasas manualmente o verifica la conexión con el servidor.';

const mobileRawStorage: StoragePort = {
  load: async (key, fallback) => {
    try {
      const saved = await AsyncStorage.getItem(key);
      if (!saved) return fallback;
      return JSON.parse(saved) as typeof fallback;
    } catch {
      return fallback;
    }
  },
  save: async (key, value) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  getRawItem: (key) => AsyncStorage.getItem(key),
  setRawItem: (key, value) => AsyncStorage.setItem(key, value),
  removeRawItem: (key) => AsyncStorage.removeItem(key),
};

const mobileScopeStorage: ScopeStorage = {
  getScope: () => loadStorageScope(),
  setScope: (tenantId) => setStorageScope(tenantId),
};

const mobileOnlineEvents: OnlineEvents = {
  subscribe(onOnline, onOffline) {
    ensureConnectivityMonitoring();
    return subscribeConnectivity(onOnline, onOffline);
  },
};

async function fetchFromBackend(): Promise<ExchangeRateSnapshot> {
  const response = await apiFetch('/api/exchange-rates', { method: 'GET' });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? MANUAL_ONLY_ERROR);
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

async function fetchExchangeSnapshot(): Promise<ExchangeRateSnapshot> {
  if (hasBackendApi()) {
    try {
      return await fetchFromBackend();
    } catch {
      if (!hasDirectEltoqueAccess()) {
        throw new Error(MANUAL_ONLY_ERROR);
      }
    }
  }

  if (hasDirectEltoqueAccess()) {
    return fetchEltoqueRates();
  }

  throw new Error(MANUAL_ONLY_ERROR);
}

async function fetchRemoteWorkspace(workspaceId: string): Promise<WorkspaceDocument | null> {
  const response = await apiFetch(`/api/sync?workspaceId=${encodeURIComponent(workspaceId)}`, {
    method: 'GET',
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
  const response = await apiFetch('/api/sync', {
    method: 'PUT',
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

function buildMobileClientDataValue(): ClientDataContextValue {
  const storage = createScopedStoragePort(mobileRawStorage, mobileScopeStorage);
  let syncCore!: SyncService;

  syncCore = createSyncService({
    storage,
    isOnline: () => {
      ensureConnectivityMonitoring();
      return isDeviceOnline();
    },
    fetchRemoteWorkspace,
    pushWorkspace: (workspaceId, tenantId, data, updatedAt) =>
      pushWorkspace(syncCore, workspaceId, tenantId, data, updatedAt),
    applyBackupToStorage: async (backup: AppBackupV1) => {
      await applyBackupToStorage(backup);
    },
  });

  return {
    storage,
    sync: syncCore,
    onlineEvents: mobileOnlineEvents,
    fetchExchangeSnapshot,
    refreshOnlineStatus: probeConnectivity,
  };
}

export function MobileClientDataProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => buildMobileClientDataValue(), []);
  return <ClientDataProvider value={value}>{children}</ClientDataProvider>;
}

export {
  useInventory,
  useRawMaterials,
  useGlobalCosts,
  useGlobalFund,
  useLaborShareSettings,
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
