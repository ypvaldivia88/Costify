import type {
  GlobalFundSettings,
  IndirectCost,
  ProductCalculation,
  RawMaterial,
  StockMovement,
  StockThreshold,
  TaxSettings,
  UnitSettings,
  Warehouse,
} from '@/lib/domain/types';
import type { ExchangeRateSettings } from '@/lib/domain/exchange-rates';
import { migrateExchangeRateSettings } from '@/lib/domain/migrate-exchange-rates';
import { migrateGlobalFundSettings } from '@/lib/domain/calculations/global-fund';
import { migrateTaxSettings } from '@/lib/domain/migrate-tax-settings';
import { migrateUnitSettings } from '@/lib/domain/unit-settings';
import {
  DEFAULT_GLOBAL_FUND_SETTINGS,
  DEFAULT_TAX_SETTINGS,
  STORAGE_KEYS,
} from '@/lib/domain/constants';
import { saveToStorage } from '@/lib/storage/local-storage';

export const BACKUP_PREFIX = 'costify1:';

export interface AppBackupV1 {
  v: 1;
  at: number;
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  taxSettings: TaxSettings;
  unitSettings?: UnitSettings;
  warehouses?: Warehouse[];
  stockMovements?: StockMovement[];
  stockThresholds?: StockThreshold[];
  exchangeRateSettings?: ExchangeRateSettings;
}

export interface AppBackupInput {
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  taxSettings: TaxSettings;
  unitSettings: UnitSettings;
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  stockThresholds: StockThreshold[];
  exchangeRateSettings: ExchangeRateSettings;
}

function toBase64Url(text: string): string {
  const base64 = btoa(unescape(encodeURIComponent(text)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);
  return decodeURIComponent(escape(atob(base64)));
}

export function createBackupPayload(input: AppBackupInput): string {
  const backup: AppBackupV1 = {
    v: 1,
    at: Date.now(),
    inventory: input.inventory,
    rawMaterials: input.rawMaterials,
    globalCosts: input.globalCosts,
    globalFund: input.globalFund,
    taxSettings: input.taxSettings,
    unitSettings: input.unitSettings,
    warehouses: input.warehouses,
    stockMovements: input.stockMovements,
    stockThresholds: input.stockThresholds,
    exchangeRateSettings: input.exchangeRateSettings,
  };
  return BACKUP_PREFIX + toBase64Url(JSON.stringify(backup));
}

export function parseBackupPayload(raw: string): AppBackupV1 {
  const trimmed = raw.trim();
  const payload = trimmed.startsWith(BACKUP_PREFIX)
    ? trimmed.slice(BACKUP_PREFIX.length)
    : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64Url(payload));
  } catch {
    throw new Error('El código de respaldo no es válido o está incompleto.');
  }

  if (!parsed || typeof parsed !== 'object' || (parsed as AppBackupV1).v !== 1) {
    throw new Error('Versión de respaldo no compatible.');
  }

  const backup = parsed as AppBackupV1;
  if (!Array.isArray(backup.inventory) || !Array.isArray(backup.rawMaterials)) {
    throw new Error('El respaldo no contiene datos válidos.');
  }

  return {
    v: 1,
    at: backup.at ?? Date.now(),
    inventory: backup.inventory,
    rawMaterials: backup.rawMaterials,
    globalCosts: Array.isArray(backup.globalCosts) ? backup.globalCosts : [],
    globalFund: migrateGlobalFundSettings(backup.globalFund ?? DEFAULT_GLOBAL_FUND_SETTINGS),
    taxSettings: migrateTaxSettings(backup.taxSettings ?? DEFAULT_TAX_SETTINGS),
    unitSettings: migrateUnitSettings(backup.unitSettings),
    warehouses: Array.isArray(backup.warehouses) ? backup.warehouses : [],
    stockMovements: Array.isArray(backup.stockMovements) ? backup.stockMovements : [],
    stockThresholds: Array.isArray(backup.stockThresholds) ? backup.stockThresholds : [],
    exchangeRateSettings: migrateExchangeRateSettings(backup.exchangeRateSettings),
  };
}

export function applyBackupToStorage(backup: AppBackupV1): void {
  saveToStorage(STORAGE_KEYS.inventory, backup.inventory);
  saveToStorage(STORAGE_KEYS.rawMaterials, backup.rawMaterials);
  saveToStorage(STORAGE_KEYS.globalCosts, backup.globalCosts);
  saveToStorage(STORAGE_KEYS.globalFund, backup.globalFund);
  saveToStorage(STORAGE_KEYS.taxSettings, migrateTaxSettings(backup.taxSettings));
  saveToStorage(STORAGE_KEYS.unitSettings, migrateUnitSettings(backup.unitSettings));
  saveToStorage(STORAGE_KEYS.warehouses, backup.warehouses ?? []);
  saveToStorage(STORAGE_KEYS.stockMovements, backup.stockMovements ?? []);
  saveToStorage(STORAGE_KEYS.stockThresholds, backup.stockThresholds ?? []);
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
        if (text.trim().startsWith(BACKUP_PREFIX)) {
          resolve(text.trim());
          return;
        }
        const json = JSON.parse(text) as AppBackupV1 | { payload?: string };
        if (typeof (json as { payload?: string }).payload === 'string') {
          resolve((json as { payload: string }).payload);
          return;
        }
        if ((json as AppBackupV1).v === 1) {
          const backup = json as AppBackupV1;
          resolve(
            createBackupPayload({
              inventory: backup.inventory,
              rawMaterials: backup.rawMaterials,
              globalCosts: backup.globalCosts ?? [],
              globalFund: migrateGlobalFundSettings(
                backup.globalFund ?? DEFAULT_GLOBAL_FUND_SETTINGS
              ),
              taxSettings: migrateTaxSettings(backup.taxSettings ?? DEFAULT_TAX_SETTINGS),
              unitSettings: migrateUnitSettings(backup.unitSettings),
              warehouses: backup.warehouses ?? [],
              stockMovements: backup.stockMovements ?? [],
              stockThresholds: backup.stockThresholds ?? [],
              exchangeRateSettings: migrateExchangeRateSettings(backup.exchangeRateSettings),
            })
          );
          return;
        }
        reject(new Error('Archivo de respaldo no reconocido.'));
      } catch {
        reject(new Error('No se pudo leer el archivo.'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsText(file);
  });
}

export function downloadBackupFile(payload: string): void {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          app: 'Costify',
          version: 1,
          exportedAt: new Date().toISOString(),
          payload,
        },
        null,
        2
      ),
    ],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `costify-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
