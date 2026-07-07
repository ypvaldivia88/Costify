import type { AppBackupInput, AppBackupV1 } from '@costify/shared/backup/backup-core';
import {
  DEFAULT_GLOBAL_FUND_SETTINGS,
  DEFAULT_LABOR_SHARE_SETTINGS,
  DEFAULT_TAX_SETTINGS,
  STORAGE_KEYS,
} from '@costify/shared/domain/constants';
import { migrateGlobalFundSettings } from '@costify/shared/domain/calculations/global-fund';
import { migrateLaborShareSettings } from '@costify/shared/domain/calculations/labor-share';
import { migrateTaxSettings } from '@costify/shared/domain/migrate-tax-settings';
import { migrateExchangeRateSettings } from '@costify/shared/domain/migrate-exchange-rates';
import { migrateUnitSettings } from '@costify/shared/domain/unit-settings';
import { getWorkspaceId } from '@costify/shared/sync/workspace-id';
import type { ScopedStoragePort } from '../storage/types';
import { notifySyncReload } from './sync-events';
import {
  hasPendingChanges,
  loadSyncMetadata,
  markLocalUpdated,
  saveSyncMetadata,
} from './sync-metadata';
import type { SyncResult, WorkspaceDocument } from './types';

export interface CreateSyncServiceOptions {
  storage: ScopedStoragePort;
  isOnline: () => boolean;
  fetchRemoteWorkspace: (workspaceId: string) => Promise<WorkspaceDocument | null>;
  pushWorkspace: (
    workspaceId: string,
    tenantId: string,
    data: AppBackupInput,
    updatedAt: number
  ) => Promise<WorkspaceDocument>;
  applyBackupToStorage: (backup: AppBackupV1) => Promise<void>;
}

export function createSyncService(options: CreateSyncServiceOptions) {
  const { storage, isOnline, fetchRemoteWorkspace, pushWorkspace, applyBackupToStorage } = options;

  async function collectLocalData(): Promise<AppBackupInput> {
    return {
      inventory: await storage.load(STORAGE_KEYS.inventory, []),
      rawMaterials: await storage.load(STORAGE_KEYS.rawMaterials, []),
      globalCosts: await storage.load(STORAGE_KEYS.globalCosts, []),
      globalFund: await storage.load(STORAGE_KEYS.globalFund, DEFAULT_GLOBAL_FUND_SETTINGS),
      laborShareSettings: migrateLaborShareSettings(
        await storage.load(STORAGE_KEYS.laborShareSettings, DEFAULT_LABOR_SHARE_SETTINGS)
      ),
      taxSettings: migrateTaxSettings(
        await storage.load(STORAGE_KEYS.taxSettings, DEFAULT_TAX_SETTINGS)
      ),
      unitSettings: migrateUnitSettings(await storage.load(STORAGE_KEYS.unitSettings, undefined)),
      warehouses: await storage.load(STORAGE_KEYS.warehouses, []),
      stockMovements: await storage.load(STORAGE_KEYS.stockMovements, []),
      stockThresholds: await storage.load(STORAGE_KEYS.stockThresholds, []),
      exchangeRateSettings: migrateExchangeRateSettings(
        await storage.load(STORAGE_KEYS.exchangeRates, null)
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
      laborShareSettings: data.laborShareSettings,
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
      laborShareSettings: migrateLaborShareSettings(
        workspace.laborShareSettings ?? DEFAULT_LABOR_SHARE_SETTINGS
      ),
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
      data.laborShareSettings.enabled ||
      data.taxSettings.sector !== 'mipyme' ||
      data.warehouses.length > 0 ||
      data.stockMovements.length > 0
    );
  }

  async function applyRemoteWorkspace(
    workspace: WorkspaceDocument | Omit<WorkspaceDocument, 'createdAt'>
  ): Promise<void> {
    await applyBackupToStorage(workspaceToBackup(workspace));
    notifySyncReload();
  }

  async function syncWithCloud(
    workspaceId = getWorkspaceId(),
    tenantId?: string
  ): Promise<SyncResult> {
    if (!isOnline()) {
      return { status: 'offline', direction: 'none' };
    }

    if (!tenantId) {
      return { status: 'error', direction: 'none', message: 'Sesión de negocio no válida.' };
    }

    const metadata = await loadSyncMetadata(storage);
    const localData = await collectLocalData();
    const localUpdatedAt = metadata.localUpdatedAt || (hasLocalData(localData) ? Date.now() : 0);

    if (localUpdatedAt > metadata.localUpdatedAt) {
      await saveSyncMetadata(storage, { ...metadata, localUpdatedAt });
    }

    const pending = hasPendingChanges({ ...metadata, localUpdatedAt });

    try {
      const remote = await fetchRemoteWorkspace(workspaceId);

      if (!remote) {
        if (!hasLocalData(localData) && localUpdatedAt === 0) {
          await saveSyncMetadata(storage, { lastSyncedAt: Date.now(), localUpdatedAt: 0 });
          return { status: 'synced', direction: 'none' };
        }

        const pushedAt = localUpdatedAt || Date.now();
        await pushWorkspace(workspaceId, tenantId, localData, pushedAt);
        await saveSyncMetadata(storage, { lastSyncedAt: pushedAt, localUpdatedAt: pushedAt });
        return { status: 'synced', direction: 'push' };
      }

      if (pending) {
        const pushAt = Math.max(localUpdatedAt, remote.updatedAt);
        await pushWorkspace(workspaceId, tenantId, localData, pushAt);
        await saveSyncMetadata(storage, { lastSyncedAt: pushAt, localUpdatedAt: pushAt });
        return { status: 'synced', direction: 'push' };
      }

      if (remote.updatedAt > metadata.lastSyncedAt) {
        await applyRemoteWorkspace(remote);
        await saveSyncMetadata(storage, {
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

  async function touchLocalData(): Promise<void> {
    await markLocalUpdated(storage);
  }

  return {
    isOnline,
    collectLocalData,
    syncWithCloud,
    touchLocalData,
    applyRemoteWorkspace,
    toWorkspacePayload,
  };
}

export type SyncService = ReturnType<typeof createSyncService>;
