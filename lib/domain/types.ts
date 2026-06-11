export type MaterialUnitType = 'gr' | 'kg' | 'lt' | 'ml';

export type DistributionCriteria = 'units' | 'direct-cost' | 'weight' | 'manual';

export type MarginType = 'markup' | 'margin';

export type ProductType = 'simple' | 'elaborated';

export interface RawMaterialInput {
  name: string;
  purchasePrice: number;
  unitType: MaterialUnitType;
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
}

export interface RecipeItemBreakdown {
  rawMaterialId: string;
  name: string;
  quantity: number;
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
  unitsPerPackage: number;
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

export interface TaxSettings {
  includeSalesTax: boolean;
  includeTerritorialContribution: boolean;
  includeProfitTaxEstimate: boolean;
  contingencyReservePercent: number;
}

export interface GlobalFundSettings {
  enabled: boolean;
  name: string;
  amount: number;
  distributionCriteria: DistributionCriteria;
  distributionUnits?: number;
}

export interface MonthlyProductProjection {
  revenue: number;
  directCost: number;
  indirectCost: number;
  grossProfit: number;
  salesTax: number;
  territorialContribution: number;
  profitBeforeTax: number;
  contingencyReserve: number;
  estimatedProfitTax: number;
  netProfit: number;
}

export interface BusinessSummary {
  totalRevenue: number;
  totalDirectCost: number;
  totalIndirectCost: number;
  totalGrossProfit: number;
  totalSalesTax: number;
  totalTerritorialContribution: number;
  totalProfitBeforeTax: number;
  totalContingencyReserve: number;
  totalEstimatedProfitTax: number;
  totalNetProfit: number;
  productCount: number;
  averageGrossMargin: number;
  totalStockValue: number;
}

export interface ProductAllocationContext {
  purchasePrice: number;
  unitsPerPackage: number;
  productionUnits: number;
  productWeight?: number;
  unitDirectCost?: number;
}
