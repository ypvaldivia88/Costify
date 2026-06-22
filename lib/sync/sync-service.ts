import type { AppBackupInput, AppBackupV1 } from '@/lib/backup/app-backup';
import { applyBackupToStorage } from '@/lib/backup/app-backup';
import {
  DEFAULT_GLOBAL_FUND_SETTINGS,
  DEFAULT_TAX_SETTINGS,
  STORAGE_KEYS,
} from '@/lib/domain/constants';
import { migrateGlobalFundSettings } from '@/lib/domain/calculations/global-fund';
import { migrateTaxSettings } from '@/lib/domain/migrate-tax-settings';
import { migrateUnitSettings } from '@/lib/domain/unit-settings';
import type { WorkspaceDocument } from '@/lib/db/workspace';
import { loadFromStorage } from '@/lib/storage/local-storage';
import { notifySyncReload } from '@/lib/sync/sync-events';
import {
  hasPendingChanges,
  loadSyncMetadata,
  markLocalUpdated,
  saveSyncMetadata,
} from '@/lib/sync/sync-metadata';
import { getWorkspaceId } from '@/lib/sync/workspace-id';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
export type SyncDirection = 'none' | 'pull' | 'push';

export interface SyncResult {
  status: Exclude<SyncStatus, 'syncing'>;
  direction: SyncDirection;
  message?: string;
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function collectLocalData(): AppBackupInput {
  return {
    inventory: loadFromStorage(STORAGE_KEYS.inventory, []),
    rawMaterials: loadFromStorage(STORAGE_KEYS.rawMaterials, []),
    globalCosts: loadFromStorage(STORAGE_KEYS.globalCosts, []),
    globalFund: loadFromStorage(STORAGE_KEYS.globalFund, DEFAULT_GLOBAL_FUND_SETTINGS),
    taxSettings: migrateTaxSettings(loadFromStorage(STORAGE_KEYS.taxSettings, DEFAULT_TAX_SETTINGS)),
    unitSettings: migrateUnitSettings(loadFromStorage(STORAGE_KEYS.unitSettings, undefined)),
    warehouses: loadFromStorage(STORAGE_KEYS.warehouses, []),
    stockMovements: loadFromStorage(STORAGE_KEYS.stockMovements, []),
    stockThresholds: loadFromStorage(STORAGE_KEYS.stockThresholds, []),
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
    updatedAt,
  };
}

function workspaceToBackup(workspace: WorkspaceDocument | Omit<WorkspaceDocument, 'createdAt'>): AppBackupV1 {
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

export function applyRemoteWorkspace(workspace: WorkspaceDocument | Omit<WorkspaceDocument, 'createdAt'>): void {
  applyBackupToStorage(workspaceToBackup(workspace));
  notifySyncReload();
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
  workspaceId: string,
  tenantId: string,
  data: AppBackupInput,
  updatedAt: number
): Promise<WorkspaceDocument> {
  const response = await fetch('/api/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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
  if (!isOnline()) {
    return { status: 'offline', direction: 'none' };
  }

  if (!tenantId) {
    return { status: 'error', direction: 'none', message: 'Sesión de negocio no válida.' };
  }

  const metadata = loadSyncMetadata();
  const localData = collectLocalData();
  const localUpdatedAt = metadata.localUpdatedAt || (hasLocalData(localData) ? Date.now() : 0);

  if (localUpdatedAt > metadata.localUpdatedAt) {
    saveSyncMetadata({ ...metadata, localUpdatedAt });
  }

  const pending = hasPendingChanges({ ...metadata, localUpdatedAt });

  try {
    const remote = await fetchRemoteWorkspace(workspaceId);

    if (!remote) {
      if (!hasLocalData(localData) && localUpdatedAt === 0) {
        saveSyncMetadata({ lastSyncedAt: Date.now(), localUpdatedAt: 0 });
        return { status: 'synced', direction: 'none' };
      }

      const pushedAt = localUpdatedAt || Date.now();
      await pushWorkspace(workspaceId, tenantId, localData, pushedAt);
      saveSyncMetadata({ lastSyncedAt: pushedAt, localUpdatedAt: pushedAt });
      return { status: 'synced', direction: 'push' };
    }

    if (pending) {
      const pushAt = Math.max(localUpdatedAt, remote.updatedAt);
      await pushWorkspace(workspaceId, tenantId, localData, pushAt);
      saveSyncMetadata({ lastSyncedAt: pushAt, localUpdatedAt: pushAt });
      return { status: 'synced', direction: 'push' };
    }

    if (remote.updatedAt > metadata.lastSyncedAt) {
      applyRemoteWorkspace(remote);
      saveSyncMetadata({
        lastSyncedAt: remote.updatedAt,
        localUpdatedAt: remote.updatedAt,
      });
      return { status: 'synced', direction: 'pull' };
    }

    return { status: 'synced', direction: 'none' };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error desconocido al sincronizar.';
    return { status: 'error', direction: 'none', message };
  }
}

export function touchLocalData(): void {
  markLocalUpdated();
}
