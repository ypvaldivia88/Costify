import type { DistributionCriteria, GlobalFundSettings, UnitType, TaxSettings } from './types';
import { getPresetLines } from './tax-presets';

export const UNIT_TYPES: UnitType[] = ['ud', 'gr', 'kg', 'lt', 'ml'];

export const UNIT_LABELS: Record<UnitType, string> = {
  ud: 'Unidad básica',
  gr: 'gr',
  kg: 'kg',
  lt: 'lt',
  ml: 'ml',
};

/** Etiqueta corta para listas y costos unitarios */
export const UNIT_SHORT_LABELS: Record<UnitType, string> = {
  ud: 'ud',
  gr: 'gr',
  kg: 'kg',
  lt: 'lt',
  ml: 'ml',
};

/** Sugerencias para la unidad de compra de productos simples */
export const PRODUCT_PURCHASE_UNIT_SUGGESTIONS = [
  'unidad',
  'caja',
  'bolsa',
  'saco',
  'paquete',
  'docena',
  'par',
  'kg',
  'gr',
  'lt',
  'ml',
  'rollo',
] as const;

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  enabled: true,
  sector: 'mipyme',
  lines: getPresetLines('mipyme'),
};

export const DEFAULT_GLOBAL_FUND_SETTINGS: GlobalFundSettings = {
  enabled: false,
  name: 'Fondo global',
  percent: 0,
};

export const DISTRIBUTION_CRITERIA_LABELS: Record<DistributionCriteria, string> = {
  units: 'Por unidades vendidas',
  'direct-cost': 'Por costo directo',
  weight: 'Por peso o volumen',
  manual: 'Manual (unidades fijas)',
};

export const DISTRIBUTION_CRITERIA_SHORT: Record<DistributionCriteria, string> = {
  units: 'Unidades',
  'direct-cost': 'Costo directo',
  weight: 'Peso/vol.',
  manual: 'Manual',
};

export const MARGIN_TYPE_LABELS = {
  markup: 'Sobre costo (recargo)',
  margin: 'Sobre venta (margen bruto)',
} as const;

export const STORAGE_KEYS = {
  inventory: 'costify_inventory_v2',
  globalCosts: 'costify_global_costs_v2',
  taxSettings: 'costify_tax_settings_v3',
  rawMaterials: 'costify_raw_materials_v2',
  globalFund: 'costify_global_fund_v2',
  theme: 'costify_theme_v1',
} as const;

export const PRODUCT_TYPE_LABELS = {
  simple: 'Producto simple',
  elaborated: 'Producto elaborado',
} as const;
