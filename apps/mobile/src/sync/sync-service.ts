import type { AppBackupInput, AppBackupV1 } from '@/backup/app-backup';
import { applyBackupToStorage } from '@/backup/app-backup';
import {
  DEFAULT_GLOBAL_FUND_SETTINGS,
  DEFAULT_TAX_SETTINGS,
  STORAGE_KEYS,
} from '@costify/shared/domain/constants';
import { migrateGlobalFundSettings } from '@costify/shared/domain/calculations/global-fund';
import { migrateTaxSettings } from '@costify/shared/domain/migrate-tax-settings';
import { migrateExchangeRateSettings } from '@costify/shared/domain/migrate-exchange-rates';
import { migrateUnitSettings } from '@costify/shared/domain/unit-settings';
import { apiFetch } from '@/api/client';
import { loadFromStorage } from '@/storage/async-storage';
import { notifySyncReload } from '@/sync/sync-events';
import {
  hasPendingChanges,
  loadSyncMetadata,
  markLocalUpdated,
  saveSyncMetadata,
} from '@/sync/sync-metadata';
import { getWorkspaceId } from '@/sync/workspace-id';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
export type SyncDirection = 'none' | 'pull' | 'push';

export interface SyncResult {
  status: Exclude<SyncStatus, 'syncing'>;
  direction: SyncDirection;
  message?: string;
}

export interface WorkspaceDocument {
  workspaceId: string;
  tenantId: string;
  inventory: AppBackupV1['inventory'];
  rawMaterials: AppBackupV1['rawMaterials'];
  globalCosts: AppBackupV1['globalCosts'];
  globalFund: AppBackupV1['globalFund'];
  taxSettings: AppBackupV1['taxSettings'];
  unitSettings: AppBackupV1['unitSettings'];
  warehouses: AppBackupV1['warehouses'];
  stockMovements: AppBackupV1['stockMovements'];
  stockThresholds: AppBackupV1['stockThresholds'];
  exchangeRateSettings?: AppBackupV1['exchangeRateSettings'];
  updatedAt: number;
  createdAt?: number;
}

export function isOnline(): boolean {
  return true;
}

export async function collectLocalData(): Promise<AppBackupInput> {
  return {
    inventory: await loadFromStorage(STORAGE_KEYS.inventory, []),
    rawMaterials: await loadFromStorage(STORAGE_KEYS.rawMaterials, []),
    globalCosts: await loadFromStorage(STORAGE_KEYS.globalCosts, []),
    globalFund: await loadFromStorage(STORAGE_KEYS.globalFund, DEFAULT_GLOBAL_FUND_SETTINGS),
    taxSettings: migrateTaxSettings(
      await loadFromStorage(STORAGE_KEYS.taxSettings, DEFAULT_TAX_SETTINGS)
    ),
    unitSettings: migrateUnitSettings(
      await loadFromStorage(STORAGE_KEYS.unitSettings, undefined)
    ),
    warehouses: await loadFromStorage(STORAGE_KEYS.warehouses, []),
    stockMovements: await loadFromStorage(STORAGE_KEYS.stockMovements, []),
    stockThresholds: await loadFromStorage(STORAGE_KEYS.stockThresholds, []),
    exchangeRateSettings: migrateExchangeRateSettings(
      await loadFromStorage(STORAGE_KEYS.exchangeRates, null)
    ),
  };
}

function toWorkspacePayload(
  workspaceId: string,
  tenantId: string,
  data: AppBackupInput,
  updatedAt: number
): Omit<WorkspaceDocument, 'createdAt'> {
  return {
    workspaceId,
    tenantId,
    inventory: data.inventory,
    rawMaterials: data.rawMaterials,
    globalCosts: data.globalCosts,
    globalFund: data.globalFund,
    taxSettings: data.taxSettings,
    unitSettings: data.unitSettings,
    warehouses: data.warehouses,
    stockMovements: data.stockMovements,
    stockThresholds: data.stockThresholds,
    exchangeRateSettings: data.exchangeRateSettings,
    updatedAt,
  };
}

function workspaceToBackup(
  workspace: WorkspaceDocument | Omit<WorkspaceDocument, 'createdAt'>
): AppBackupV1 {
  return {
    v: 1,
    at: workspace.updatedAt,
    inventory: workspace.inventory,
    rawMaterials: workspace.rawMaterials,
    globalCosts: workspace.globalCosts,
    globalFund: migrateGlobalFundSettings(workspace.globalFund),
    taxSettings: migrateTaxSettings(workspace.taxSettings),
    unitSettings: migrateUnitSettings(workspace.unitSettings),
    warehouses: workspace.warehouses ?? [],
    stockMovements: workspace.stockMovements ?? [],
    stockThresholds: workspace.stockThresholds ?? [],
    exchangeRateSettings: migrateExchangeRateSettings(workspace.exchangeRateSettings),
  };
}

function hasLocalData(data: AppBackupInput): boolean {
  return (
    data.inventory.length > 0 ||
    data.rawMaterials.length > 0 ||
    data.globalCosts.length > 0 ||
    data.globalFund.enabled ||
    data.taxSettings.sector !== 'mipyme' ||
    data.warehouses.length > 0 ||
    data.stockMovements.length > 0
  );
}

export async function applyRemoteWorkspace(
  workspace: WorkspaceDocument | Omit<WorkspaceDocument, 'createdAt'>
): Promise<void> {
  await applyBackupToStorage(workspaceToBackup(workspace));
  notifySyncReload();
}

async function fetchRemoteWorkspace(workspaceId: string): Promise<WorkspaceDocument | null> {
  const response = await apiFetch(
    `/api/sync?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: 'GET' }
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error('No se pudo descargar los datos de la nube.');
  }

  const json = (await response.json()) as { workspace: WorkspaceDocument };
  return json.workspace;
}

async function pushWorkspace(
  workspaceId: string,
  tenantId: string,
  data: AppBackupInput,
  updatedAt: number
): Promise<WorkspaceDocument> {
  const response = await apiFetch('/api/sync', {
    method: 'PUT',
    body: JSON.stringify(toWorkspacePayload(workspaceId, tenantId, data, updatedAt)),
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

export async function syncWithCloud(
  workspaceId = getWorkspaceId(),
  tenantId?: string
): Promise<SyncResult> {
  if (!tenantId) {
    return { status: 'error', direction: 'none', message: 'Sesión de negocio no válida.' };
  }

  const metadata = await loadSyncMetadata();
  const localData = await collectLocalData();
  const localUpdatedAt = metadata.localUpdatedAt || (hasLocalData(localData) ? Date.now() : 0);

  if (localUpdatedAt > metadata.localUpdatedAt) {
    await saveSyncMetadata({ ...metadata, localUpdatedAt });
  }

  const pending = hasPendingChanges({ ...metadata, localUpdatedAt });

  try {
    const remote = await fetchRemoteWorkspace(workspaceId);

    if (!remote) {
      if (!hasLocalData(localData) && localUpdatedAt === 0) {
        await saveSyncMetadata({ lastSyncedAt: Date.now(), localUpdatedAt: 0 });
        return { status: 'synced', direction: 'none' };
      }

      const pushedAt = localUpdatedAt || Date.now();
      await pushWorkspace(workspaceId, tenantId, localData, pushedAt);
      await saveSyncMetadata({ lastSyncedAt: pushedAt, localUpdatedAt: pushedAt });
      return { status: 'synced', direction: 'push' };
    }

    if (pending) {
      const pushAt = Math.max(localUpdatedAt, remote.updatedAt);
      await pushWorkspace(workspaceId, tenantId, localData, pushAt);
      await saveSyncMetadata({ lastSyncedAt: pushAt, localUpdatedAt: pushAt });
      return { status: 'synced', direction: 'push' };
    }

    if (remote.updatedAt > metadata.lastSyncedAt) {
      await applyRemoteWorkspace(remote);
      await saveSyncMetadata({
        lastSyncedAt: remote.updatedAt,
        localUpdatedAt: remote.updatedAt,
      });
      return { status: 'synced', direction: 'pull' };
    }

    return { status: 'synced', direction: 'none' };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error desconocido al sincronizar.';
    if (message.includes('Network request failed') || message.includes('Failed to fetch')) {
      return { status: 'offline', direction: 'none' };
    }
    return { status: 'error', direction: 'none', message };
  }
}

export async function touchLocalData(): Promise<void> {
  await markLocalUpdated();
}
