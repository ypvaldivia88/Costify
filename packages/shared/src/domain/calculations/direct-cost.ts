/**
 * Costo directo unitario (CDU).
 * Fórmula estándar de ficha de costos: precio de compra ÷ unidades por paquete.
 */
export function calculateUnitDirectCost(
  purchasePrice: number,
  unitsPerPackage: number
): number {
  const units = unitsPerPackage > 0 ? unitsPerPackage : 1;
  return purchasePrice / units;
}

export function calculateTotalDirectCost(
  unitDirectCost: number,
  productionUnits: number
): number {
  return unitDirectCost * productionUnits;
}
