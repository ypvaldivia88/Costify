import type { MarginType } from '../types';

/**
 * Calcula precio de venta según el tipo de margen:
 * - markup (recargo sobre costo): Precio = Costo × (1 + %/100)
 * - margin (margen bruto sobre venta): Precio = Costo / (1 - %/100)
 */
export function calculateSuggestedPrice(
  totalUnitCost: number,
  profitMargin: number,
  marginType: MarginType
): number {
  if (totalUnitCost <= 0) return 0;

  if (marginType === 'margin') {
    const marginDecimal = profitMargin / 100;
    if (marginDecimal >= 1) return totalUnitCost * 2;
    return totalUnitCost / (1 - marginDecimal);
  }

  return totalUnitCost * (1 + profitMargin / 100);
}

/** Margen bruto real sobre venta: (Precio - Costo) / Precio × 100 */
export function calculateGrossMarginPercent(
  suggestedPrice: number,
  totalUnitCost: number
): number {
  if (suggestedPrice <= 0) return 0;
  return ((suggestedPrice - totalUnitCost) / suggestedPrice) * 100;
}

export function calculateProfitPerUnit(
  suggestedPrice: number,
  totalUnitCost: number
): number {
  return suggestedPrice - totalUnitCost;
}
