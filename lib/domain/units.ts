import type { UnitType } from './types';

const WEIGHT_UNITS: UnitType[] = ['gr', 'kg', 'lb'];
const VOLUME_UNITS: UnitType[] = ['ml', 'lt'];

const GRAMS_PER: Partial<Record<UnitType, number>> = {
  gr: 1,
  kg: 1000,
  lb: 453.592,
};

const ML_PER: Partial<Record<UnitType, number>> = {
  ml: 1,
  lt: 1000,
};

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

  const fromGrams = GRAMS_PER[from];
  const toGrams = GRAMS_PER[to];
  if (fromGrams !== undefined && toGrams !== undefined) {
    return (value * fromGrams) / toGrams;
  }

  const fromMl = ML_PER[from];
  const toMl = ML_PER[to];
  if (fromMl !== undefined && toMl !== undefined) {
    return (value * fromMl) / toMl;
  }

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
