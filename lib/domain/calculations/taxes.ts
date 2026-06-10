import { CUBAN_MIPYME_TAX_RATES } from '../constants';
import type { MonthlyProductProjection, TaxSettings } from '../types';

export function calculateMonthlyTaxProjection(
  revenue: number,
  grossProfit: number,
  settings: TaxSettings
): Pick<
  MonthlyProductProjection,
  | 'salesTax'
  | 'territorialContribution'
  | 'profitBeforeTax'
  | 'contingencyReserve'
  | 'estimatedProfitTax'
  | 'netProfit'
> {
  const salesTax = settings.includeSalesTax
    ? revenue * CUBAN_MIPYME_TAX_RATES.salesTax
    : 0;

  const territorialContribution = settings.includeTerritorialContribution
    ? revenue * CUBAN_MIPYME_TAX_RATES.territorialContribution
    : 0;

  const profitBeforeTax = grossProfit - salesTax - territorialContribution;

  const contingencyRate = settings.contingencyReservePercent / 100;
  const contingencyReserve =
    settings.includeProfitTaxEstimate && profitBeforeTax > 0
      ? profitBeforeTax * contingencyRate
      : 0;

  const taxableProfit = Math.max(profitBeforeTax - contingencyReserve, 0);

  const estimatedProfitTax =
    settings.includeProfitTaxEstimate && taxableProfit > 0
      ? taxableProfit * CUBAN_MIPYME_TAX_RATES.profitTax
      : 0;

  const netProfit = profitBeforeTax - contingencyReserve - estimatedProfitTax;

  return {
    salesTax,
    territorialContribution,
    profitBeforeTax,
    contingencyReserve,
    estimatedProfitTax,
    netProfit,
  };
}
