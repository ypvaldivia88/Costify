import type { DistributionCriteria, TaxSettings } from './types';

/** Tasas según Resolución 306/2023 del MFP (MIPYMES Cuba, vigente desde 2024) */
export const CUBAN_MIPYME_TAX_RATES = {
  /** Impuesto sobre Ventas y Servicios */
  salesTax: 0.1,
  /** Contribución Territorial para el Desarrollo Local */
  territorialContribution: 0.01,
  /** Impuesto sobre Utilidades */
  profitTax: 0.35,
  /** Reserva para pérdidas y contingencias (mín 2%, máx 10% de gastos; usamos 10% de utilidad) */
  defaultContingencyReserve: 0.1,
} as const;

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  includeSalesTax: true,
  includeTerritorialContribution: true,
  includeProfitTaxEstimate: false,
  contingencyReservePercent: 10,
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
  taxSettings: 'costify_tax_settings_v2',
  rawMaterials: 'costify_raw_materials_v2',
} as const;

export const PRODUCT_TYPE_LABELS = {
  simple: 'Producto simple',
  elaborated: 'Producto elaborado',
} as const;
