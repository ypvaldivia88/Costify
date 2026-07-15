import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { migrateExchangeRateSettings } from '@costify/shared/domain/migrate-exchange-rates';
import { migrateGlobalFundSettings } from '@costify/shared/domain/calculations/global-fund';
import { migrateLaborShareSettings } from '@costify/shared/domain/calculations/labor-share';
import { migrateTaxSettings } from '@costify/shared/domain/migrate-tax-settings';
import { migrateUnitSettings } from '@costify/shared/domain/unit-settings';
import type { AppBackupV1 } from '@costify/shared/backup/backup-core';
import {
  buildBackupFileContent,
  createBackupPayload,
  parseBackupFileContent,
  parseBackupPayload,
} from '@costify/shared/backup/backup-core';
import { saveToStorage } from '@/storage/async-storage';

export type { AppBackupInput, AppBackupV1 } from '@costify/shared/backup/backup-core';
export {
  BACKUP_PREFIX,
  buildBackupFileContent,
  createBackupPayload,
  parseBackupFileContent,
  parseBackupPayload,
} from '@costify/shared/backup/backup-core';

export async function applyBackupToStorage(backup: AppBackupV1): Promise<void> {
  await saveToStorage(STORAGE_KEYS.inventory, backup.inventory);
  await saveToStorage(STORAGE_KEYS.rawMaterials, backup.rawMaterials);
  await saveToStorage(STORAGE_KEYS.globalCosts, backup.globalCosts);
  await saveToStorage(STORAGE_KEYS.globalFund, backup.globalFund);
  await saveToStorage(
    STORAGE_KEYS.laborShareSettings,
    migrateLaborShareSettings(backup.laborShareSettings)
  );
  await saveToStorage(STORAGE_KEYS.taxSettings, migrateTaxSettings(backup.taxSettings));
  await saveToStorage(STORAGE_KEYS.unitSettings, migrateUnitSettings(backup.unitSettings));
  await saveToStorage(STORAGE_KEYS.locations, backup.locations ?? []);
  await saveToStorage(STORAGE_KEYS.warehouses, backup.warehouses ?? []);
  await saveToStorage(STORAGE_KEYS.stockMovements, backup.stockMovements ?? []);
  await saveToStorage(STORAGE_KEYS.stockThresholds, backup.stockThresholds ?? []);
  await saveToStorage(STORAGE_KEYS.sales, backup.sales ?? []);
  await saveToStorage(
    STORAGE_KEYS.exchangeRates,
    migrateExchangeRateSettings(backup.exchangeRateSettings)
  );
}
