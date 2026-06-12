import type { UnitType } from './types';

const WEIGHT_UNITS: UnitType[] = ['gr', 'kg'];
const VOLUME_UNITS: UnitType[] = ['ml', 'lt'];

export function getUnitFamily(unit: UnitType): 'weight' | 'volume' | 'count' {
  if (WEIGHT_UNITS.includes(unit)) return 'weight';
  if (VOLUME_UNITS.includes(unit)) return 'volume';
  return 'count';
}

export function areUnitsCompatible(a: UnitType, b: UnitType): boolean {
  return getUnitFamily(a) === getUnitFamily(b);
}

/** Unidades disponibles al confeccionar una receta a partir de la unidad de compra */
export function getRecipeUnitOptions(materialUnit: UnitType): UnitType[] {
  const family = getUnitFamily(materialUnit);
  if (family === 'weight') return WEIGHT_UNITS;
  if (family === 'volume') return VOLUME_UNITS;
  return ['ud'];
}

export function convertQuantity(value: number, from: UnitType, to: UnitType): number {
  if (from === to) return value;
  if (!areUnitsCompatible(from, to)) return value;

  if (from === 'kg' && to === 'gr') return value * 1000;
  if (from === 'gr' && to === 'kg') return value / 1000;
  if (from === 'lt' && to === 'ml') return value * 1000;
  if (from === 'ml' && to === 'lt') return value / 1000;

  return value;
}

export function resolveRecipeUnit(item: { unitType?: UnitType }, materialUnit: UnitType): UnitType {
  const unit = item.unitType ?? materialUnit;
  return areUnitsCompatible(unit, materialUnit) ? unit : materialUnit;
}

/** Cantidad de la receta expresada en la unidad de la materia prima (para costo y stock) */
export function recipeQuantityInMaterialUnit(
  quantity: number,
  recipeUnit: UnitType,
  materialUnit: UnitType
): number {
  return convertQuantity(quantity, recipeUnit, materialUnit);
}

/** Costo unitario de la materia prima expresado en la unidad de la receta */
export function materialUnitCostInRecipeUnit(
  unitCost: number,
  materialUnit: UnitType,
  recipeUnit: UnitType
): number {
  const factor = recipeQuantityInMaterialUnit(1, recipeUnit, materialUnit);
  return unitCost * factor;
}
