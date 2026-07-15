import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { migrateExchangeRateSettings } from '@costify/shared/domain/migrate-exchange-rates';
import { migrateGlobalFundSettings } from '@costify/shared/domain/calculations/global-fund';
import { migrateLaborShareSettings } from '@costify/shared/domain/calculations/labor-share';
import { migrateTaxSettings } from '@costify/shared/domain/migrate-tax-settings';
import { migrateUnitSettings } from '@costify/shared/domain/unit-settings';
import type { AppBackupV1 } from '@costify/shared/backup/backup-core';
import {
  BACKUP_PREFIX,
  buildBackupFileContent,
  createBackupPayload,
  parseBackupFileContent,
  parseBackupPayload,
} from '@costify/shared/backup/backup-core';
import { saveToStorage } from '@/lib/storage/local-storage';

export type { AppBackupInput, AppBackupV1 } from '@costify/shared/backup/backup-core';
export {
  BACKUP_PREFIX,
  buildBackupFileContent,
  createBackupPayload,
  parseBackupFileContent,
  parseBackupPayload,
} from '@costify/shared/backup/backup-core';

export function applyBackupToStorage(backup: AppBackupV1): void {
  saveToStorage(STORAGE_KEYS.inventory, backup.inventory);
  saveToStorage(STORAGE_KEYS.rawMaterials, backup.rawMaterials);
  saveToStorage(STORAGE_KEYS.globalCosts, backup.globalCosts);
  saveToStorage(STORAGE_KEYS.globalFund, backup.globalFund);
  saveToStorage(
    STORAGE_KEYS.laborShareSettings,
    migrateLaborShareSettings(backup.laborShareSettings)
  );
  saveToStorage(STORAGE_KEYS.taxSettings, migrateTaxSettings(backup.taxSettings));
  saveToStorage(STORAGE_KEYS.unitSettings, migrateUnitSettings(backup.unitSettings));
  saveToStorage(STORAGE_KEYS.locations, backup.locations ?? []);
  saveToStorage(STORAGE_KEYS.warehouses, backup.warehouses ?? []);
  saveToStorage(STORAGE_KEYS.stockMovements, backup.stockMovements ?? []);
  saveToStorage(STORAGE_KEYS.stockThresholds, backup.stockThresholds ?? []);
  saveToStorage(STORAGE_KEYS.sales, backup.sales ?? []);
  saveToStorage(
    STORAGE_KEYS.exchangeRates,
    migrateExchangeRateSettings(backup.exchangeRateSettings)
  );
}

export function readBackupFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      try {
        resolve(parseBackupFileContent(text));
      } catch (error) {
        reject(error instanceof Error ? error : new Error('No se pudo leer el archivo.'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsText(file);
  });
}

export function downloadBackupFile(payload: string): void {
  const blob = new Blob([buildBackupFileContent(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `costify-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
