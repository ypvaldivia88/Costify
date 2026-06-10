export type DistributionCriteria = 'units' | 'direct-cost' | 'weight' | 'manual';

export type MarginType = 'markup' | 'margin';

export interface IndirectCost {
  id: string;
  name: string;
  amount: number;
  distributionCriteria: DistributionCriteria;
  distributionUnits?: number;
}

export interface ProductInput {
  name: string;
  purchasePrice: number;
  unitsPerPackage: number;
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
  timestamp: number;
}

export interface TaxSettings {
  includeSalesTax: boolean;
  includeTerritorialContribution: boolean;
  includeProfitTaxEstimate: boolean;
  contingencyReservePercent: number;
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
}
