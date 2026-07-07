import type {
  GlobalFundSettings,
  IndirectCost,
  LaborShareSettings,
  ProductCalculation,
  RawMaterial,
  StockMovement,
  StockThreshold,
  TaxSettings,
  UnitSettings,
  Warehouse,
} from '../domain/types';
import type { ExchangeRateSettings } from '../domain/exchange-rates';
import { migrateExchangeRateSettings } from '../domain/migrate-exchange-rates';
import { migrateGlobalFundSettings } from '../domain/calculations/global-fund';
import { migrateLaborShareSettings } from '../domain/calculations/labor-share';
import { migrateTaxSettings } from '../domain/migrate-tax-settings';
import { migrateUnitSettings } from '../domain/unit-settings';
import {
  DEFAULT_GLOBAL_FUND_SETTINGS,
  DEFAULT_LABOR_SHARE_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '../domain/constants';

export const BACKUP_PREFIX = 'costify1:';

export interface AppBackupV1 {
  v: 1;
  at: number;
  inventory: ProductCalculation[];
  rawMaterials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  laborShareSettings?: LaborShareSettings;
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
  laborShareSettings: LaborShareSettings;
  taxSettings: TaxSettings;
  unitSettings: UnitSettings;
  warehouses: Warehouse[];
  stockMovements: StockMovement[];
  stockThresholds: StockThreshold[];
  exchangeRateSettings: ExchangeRateSettings;
}

function encodeBase64Url(text: string): string {
  let base64: string;
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(text, 'utf8').toString('base64');
  } else if (typeof btoa !== 'undefined') {
    base64 = btoa(unescape(encodeURIComponent(text)));
  } else {
    throw new Error('Base64 encoding is not available in this environment.');
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(encoded: string): string {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf8');
  }
  if (typeof atob !== 'undefined') {
    return decodeURIComponent(escape(atob(base64)));
  }
  throw new Error('Base64 decoding is not available in this environment.');
}

export function createBackupPayload(input: AppBackupInput): string {
  const backup: AppBackupV1 = {
    v: 1,
    at: Date.now(),
    inventory: input.inventory,
    rawMaterials: input.rawMaterials,
    globalCosts: input.globalCosts,
    globalFund: input.globalFund,
    laborShareSettings: input.laborShareSettings,
    taxSettings: input.taxSettings,
    unitSettings: input.unitSettings,
    warehouses: input.warehouses,
    stockMovements: input.stockMovements,
    stockThresholds: input.stockThresholds,
    exchangeRateSettings: input.exchangeRateSettings,
  };
  return BACKUP_PREFIX + encodeBase64Url(JSON.stringify(backup));
}

export function parseBackupPayload(raw: string): AppBackupV1 {
  const trimmed = raw.trim();
  const payload = trimmed.startsWith(BACKUP_PREFIX)
    ? trimmed.slice(BACKUP_PREFIX.length)
    : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeBase64Url(payload));
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
    laborShareSettings: migrateLaborShareSettings(
      backup.laborShareSettings ?? DEFAULT_LABOR_SHARE_SETTINGS
    ),
    taxSettings: migrateTaxSettings(backup.taxSettings ?? DEFAULT_TAX_SETTINGS),
    unitSettings: migrateUnitSettings(backup.unitSettings),
    warehouses: Array.isArray(backup.warehouses) ? backup.warehouses : [],
    stockMovements: Array.isArray(backup.stockMovements) ? backup.stockMovements : [],
    stockThresholds: Array.isArray(backup.stockThresholds) ? backup.stockThresholds : [],
    exchangeRateSettings: migrateExchangeRateSettings(backup.exchangeRateSettings),
  };
}

export function parseBackupFileContent(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith(BACKUP_PREFIX)) {
    return trimmed;
  }

  const json = (() => {
    try {
      return JSON.parse(text) as AppBackupV1 | { payload?: string };
    } catch {
      throw new Error('El archivo no contiene un respaldo JSON válido.');
    }
  })();
  if (typeof (json as { payload?: string }).payload === 'string') {
    return (json as { payload: string }).payload;
  }
  if ((json as AppBackupV1).v === 1) {
    const backup = json as AppBackupV1;
    return createBackupPayload({
      inventory: backup.inventory,
      rawMaterials: backup.rawMaterials,
      globalCosts: backup.globalCosts ?? [],
      globalFund: migrateGlobalFundSettings(backup.globalFund ?? DEFAULT_GLOBAL_FUND_SETTINGS),
      laborShareSettings: migrateLaborShareSettings(
        backup.laborShareSettings ?? DEFAULT_LABOR_SHARE_SETTINGS
      ),
      taxSettings: migrateTaxSettings(backup.taxSettings ?? DEFAULT_TAX_SETTINGS),
      unitSettings: migrateUnitSettings(backup.unitSettings),
      warehouses: backup.warehouses ?? [],
      stockMovements: backup.stockMovements ?? [],
      stockThresholds: backup.stockThresholds ?? [],
      exchangeRateSettings: migrateExchangeRateSettings(backup.exchangeRateSettings),
    });
  }
  throw new Error('Archivo de respaldo no reconocido.');
}

export function buildBackupFileContent(payload: string): string {
  return JSON.stringify(
    {
      app: 'Costify',
      version: 1,
      exportedAt: new Date().toISOString(),
      payload,
    },
    null,
    2
  );
}
