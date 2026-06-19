export type UnitType = string;

export type UnitFamily = 'count' | 'weight' | 'volume';

export interface UnitDefinition {
  id: string;
  label: string;
  shortLabel: string;
  family: UnitFamily;
  /** Factor respecto a la unidad base (gr para peso, ml para volumen) */
  factor: number;
  builtin?: boolean;
}

export interface UnitSettings {
  units: UnitDefinition[];
}

export type DistributionCriteria = 'units' | 'direct-cost' | 'weight' | 'manual';

export type MarginType = 'markup' | 'margin';

export type ProductType = 'simple' | 'elaborated';

export interface RawMaterialInput {
  name: string;
  purchasePrice: number;
  unitType: UnitType;
  packageQuantity: number;
  stockQuantity: number;
}

export interface RawMaterial extends RawMaterialInput {
  id: string;
  unitCost: number;
  timestamp: number;
}

export interface RecipeItem {
  rawMaterialId: string;
  quantity: number;
  /** Unidad en que se ingresa la cantidad en la receta (ej. gr aunque la compra sea en kg) */
  unitType?: UnitType;
}

export interface RecipeItemBreakdown {
  rawMaterialId: string;
  name: string;
  quantity: number;
  unitType: UnitType;
  unitCost: number;
  lineCost: number;
}

export interface IndirectCost {
  id: string;
  name: string;
  amount: number;
  distributionCriteria: DistributionCriteria;
  distributionUnits?: number;
}

export interface ProductInput {
  name: string;
  productType: ProductType;
  purchasePrice: number;
  /** Etiqueta libre: unidad, caja, bolsa, kg, par, etc. */
  purchaseUnit: string;
  packageQuantity: number;
  recipe?: RecipeItem[];
  productionUnits: number;
  productWeight?: number;
  indirectCosts: IndirectCost[];
  profitMargin: number;
  marginType: MarginType;
}

export interface IndirectCostBreakdown {
  name: string;
  assigned: number;
  perUnit: number;
  criteria: DistributionCriteria;
}

export interface ProductCalculation extends ProductInput {
  id: string;
  unitCost: number;
  totalIndirectPerUnit: number;
  totalUnitCost: number;
  suggestedPrice: number;
  profitPerUnit: number;
  grossMarginPercent: number;
  indirectBreakdown: IndirectCostBreakdown[];
  recipeBreakdown?: RecipeItemBreakdown[];
  timestamp: number;
}

/** Sector tributario en Cuba (referencia normativa; tasas editables en la app) */
export type TaxSector = 'none' | 'tcp' | 'mipyme' | 'cna' | 'custom';

/** Base sobre la que se aplica cada línea de impuesto */
export type TaxLineBase = 'revenue' | 'revenueExcess' | 'remainingProfit';

export interface TaxLine {
  id: string;
  name: string;
  enabled: boolean;
  /** Porcentaje (ej. 10 = 10%) */
  ratePercent: number;
  base: TaxLineBase;
  /** Umbral mensual en CUP (p. ej. TCP: ingresos exentos hasta ~3 270 CUP/mes) */
  monthlyThresholdCup?: number;
}

export interface TaxSettings {
  /** Si false, no se aplican impuestos en proyecciones */
  enabled: boolean;
  sector: TaxSector;
  lines: TaxLine[];
}

export interface TaxLineAmount {
  id: string;
  name: string;
  amount: number;
}

export interface TaxProjection {
  taxLines: TaxLineAmount[];
  totalTaxes: number;
  netProfit: number;
}

export interface GlobalFundSettings {
  enabled: boolean;
  name: string;
  /** Porcentaje del costo directo unitario */
  percent: number;
}

export interface MonthlyProductProjection {
  revenue: number;
  directCost: number;
  indirectCost: number;
  grossProfit: number;
  taxLines: TaxLineAmount[];
  totalTaxes: number;
  netProfit: number;
}

export interface BusinessSummary {
  totalRevenue: number;
  totalDirectCost: number;
  totalIndirectCost: number;
  totalGrossProfit: number;
  taxLineTotals: TaxLineAmount[];
  totalTaxes: number;
  totalNetProfit: number;
  productCount: number;
  averageGrossMargin: number;
  totalStockValue: number;
}

export interface ProductAllocationContext {
  purchasePrice: number;
  packageQuantity: number;
  productionUnits: number;
  productWeight?: number;
  unitDirectCost?: number;
}
