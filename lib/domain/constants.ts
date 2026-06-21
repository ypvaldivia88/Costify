import type { DistributionCriteria, GlobalFundSettings, TaxSettings } from './types';
import { getPresetLines } from './tax-presets';

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
  unitSettings: 'costify_unit_settings_v1',
  theme: 'costify_theme_v1',
  syncWorkspaceId: 'costify_workspace_id_v1',
  syncMetadata: 'costify_sync_metadata_v1',
} as const;

export const PRODUCT_TYPE_LABELS = {
  simple: 'Producto simple',
  elaborated: 'Producto elaborado',
} as const;
