import type { BusinessSummary, ProductCalculation, TaxSettings } from '../types';
import { calculateMonthlyTaxProjection } from './taxes';

export function calculateBusinessSummary(
  products: ProductCalculation[],
  taxSettings: TaxSettings
): BusinessSummary {
  const base = products.reduce(
    (acc, product) => {
      const revenue = product.suggestedPrice * product.productionUnits;
      const directCost = product.unitCost * product.productionUnits;
      const indirectCost = product.totalIndirectPerUnit * product.productionUnits;
      const grossProfit = product.profitPerUnit * product.productionUnits;
      const taxes = calculateMonthlyTaxProjection(revenue, grossProfit, taxSettings);

      return {
        totalRevenue: acc.totalRevenue + revenue,
        totalDirectCost: acc.totalDirectCost + directCost,
        totalIndirectCost: acc.totalIndirectCost + indirectCost,
        totalGrossProfit: acc.totalGrossProfit + grossProfit,
        totalSalesTax: acc.totalSalesTax + taxes.salesTax,
        totalTerritorialContribution:
          acc.totalTerritorialContribution + taxes.territorialContribution,
        totalProfitBeforeTax: acc.totalProfitBeforeTax + taxes.profitBeforeTax,
        totalContingencyReserve: acc.totalContingencyReserve + taxes.contingencyReserve,
        totalEstimatedProfitTax: acc.totalEstimatedProfitTax + taxes.estimatedProfitTax,
        totalNetProfit: acc.totalNetProfit + taxes.netProfit,
        totalStockValue: acc.totalStockValue + product.suggestedPrice * product.productionUnits,
        grossMarginSum: acc.grossMarginSum + product.grossMarginPercent,
      };
    },
    {
      totalRevenue: 0,
      totalDirectCost: 0,
      totalIndirectCost: 0,
      totalGrossProfit: 0,
      totalSalesTax: 0,
      totalTerritorialContribution: 0,
      totalProfitBeforeTax: 0,
      totalContingencyReserve: 0,
      totalEstimatedProfitTax: 0,
      totalNetProfit: 0,
      totalStockValue: 0,
      grossMarginSum: 0,
    }
  );

  return {
    totalRevenue: base.totalRevenue,
    totalDirectCost: base.totalDirectCost,
    totalIndirectCost: base.totalIndirectCost,
    totalGrossProfit: base.totalGrossProfit,
    totalSalesTax: base.totalSalesTax,
    totalTerritorialContribution: base.totalTerritorialContribution,
    totalProfitBeforeTax: base.totalProfitBeforeTax,
    totalContingencyReserve: base.totalContingencyReserve,
    totalEstimatedProfitTax: base.totalEstimatedProfitTax,
    totalNetProfit: base.totalNetProfit,
    totalStockValue: base.totalStockValue,
    productCount: products.length,
    averageGrossMargin:
      products.length > 0 ? base.grossMarginSum / products.length : 0,
  };
}
