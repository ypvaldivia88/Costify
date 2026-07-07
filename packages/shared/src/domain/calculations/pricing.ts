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
  return calculateSuggestedPriceWithLaborShare(totalUnitCost, profitMargin, marginType, 0);
}

/**
 * Precio con participación salarial (% del precio de venta) resuelto algebraicamente.
 * - margin: Precio = Costo / (1 - %salarios - %margen)
 * - markup: Precio = Costo × (1 + %recargo) / (1 - %salarios)
 */
export function calculateSuggestedPriceWithLaborShare(
  fixedUnitCost: number,
  profitMargin: number,
  marginType: MarginType,
  laborSharePercent: number
): number {
  if (fixedUnitCost <= 0) return 0;

  const labor = laborSharePercent / 100;

  if (marginType === 'margin') {
    const marginDecimal = profitMargin / 100;
    const divisor = 1 - labor - marginDecimal;
    if (divisor <= 0) return fixedUnitCost * 2;
    return fixedUnitCost / divisor;
  }

  const divisor = 1 - labor;
  if (divisor <= 0) return fixedUnitCost * 2;
  return (fixedUnitCost * (1 + profitMargin / 100)) / divisor;
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
