import type { AppBackupV1 } from '@costify/shared/backup/backup-core';

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
  laborShareSettings?: AppBackupV1['laborShareSettings'];
  taxSettings: AppBackupV1['taxSettings'];
  unitSettings: AppBackupV1['unitSettings'];
  warehouses: AppBackupV1['warehouses'];
  stockMovements: AppBackupV1['stockMovements'];
  stockThresholds: AppBackupV1['stockThresholds'];
  exchangeRateSettings?: AppBackupV1['exchangeRateSettings'];
  updatedAt: number;
  createdAt?: number;
}

export interface SyncMetadata {
  lastSyncedAt: number;
  localUpdatedAt: number;
}

export const DEFAULT_SYNC_METADATA: SyncMetadata = {
  lastSyncedAt: 0,
  localUpdatedAt: 0,
};
