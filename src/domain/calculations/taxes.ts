import type { TaxLine, TaxProjection, TaxSettings } from '../types';

function lineAmount(
  line: TaxLine,
  revenue: number,
  remainingProfit: number
): number {
  if (!line.enabled || line.ratePercent <= 0) return 0;

  const rate = line.ratePercent / 100;

  switch (line.base) {
    case 'revenue':
      return revenue * rate;
    case 'revenueExcess': {
      const threshold = line.monthlyThresholdCup ?? 0;
      const excess = Math.max(revenue - threshold, 0);
      return excess * rate;
    }
    case 'remainingProfit':
      return Math.max(remainingProfit, 0) * rate;
    default:
      return 0;
  }
}

export function calculateTaxProjection(
  revenue: number,
  grossProfit: number,
  settings: TaxSettings
): TaxProjection {
  if (!settings.enabled || settings.sector === 'none') {
    return { taxLines: [], totalTaxes: 0, netProfit: grossProfit };
  }

  const taxLines: TaxProjection['taxLines'] = [];
  let remainingProfit = grossProfit;
  let totalTaxes = 0;

  for (const line of settings.lines) {
    const amount = lineAmount(line, revenue, remainingProfit);
    if (amount <= 0) continue;

    taxLines.push({ id: line.id, name: line.name, amount });
    totalTaxes += amount;
    remainingProfit -= amount;
  }

  return {
    taxLines,
    totalTaxes,
    netProfit: remainingProfit,
  };
}

/** Proyección mensual de impuestos para un producto */
export function calculateMonthlyTaxProjection(
  revenue: number,
  grossProfit: number,
  settings: TaxSettings
): Pick<import('../types').MonthlyProductProjection, 'taxLines' | 'totalTaxes' | 'netProfit'> {
  return calculateTaxProjection(revenue, grossProfit, settings);
}

export function hasActiveTaxes(settings: TaxSettings): boolean {
  if (!settings.enabled || settings.sector === 'none') return false;
  return settings.lines.some((line) => line.enabled && line.ratePercent > 0);
}

export function mergeTaxLineTotals(
  totals: Map<string, { id: string; name: string; amount: number }>,
  lines: { id: string; name: string; amount: number }[]
): void {
  for (const line of lines) {
    const existing = totals.get(line.id);
    if (existing) {
      existing.amount += line.amount;
    } else {
      totals.set(line.id, { id: line.id, name: line.name, amount: line.amount });
    }
  }
}
