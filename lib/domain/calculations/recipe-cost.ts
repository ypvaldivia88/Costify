import type { RawMaterial, RecipeItem, RecipeItemBreakdown, UnitType } from '../types';
import {
  materialUnitCostInRecipeUnit,
  recipeQuantityInMaterialUnit,
  resolveRecipeUnit,
} from '../units';

function lineCostForRecipeItem(item: RecipeItem, material: RawMaterial): number {
  const recipeUnit = resolveRecipeUnit(item, material.unitType);
  const quantityInMaterialUnit = recipeQuantityInMaterialUnit(
    item.quantity,
    recipeUnit,
    material.unitType
  );
  return material.unitCost * quantityInMaterialUnit;
}

export function calculateRecipeUnitCost(
  recipe: RecipeItem[],
  rawMaterials: RawMaterial[]
): { unitCost: number; breakdown: RecipeItemBreakdown[] } {
  const breakdown: RecipeItemBreakdown[] = [];
  let unitCost = 0;

  for (const item of recipe) {
    if (item.quantity <= 0) continue;

    const material = rawMaterials.find((m) => m.id === item.rawMaterialId);
    if (!material) continue;

    const recipeUnit = resolveRecipeUnit(item, material.unitType);
    const lineCost = lineCostForRecipeItem(item, material);
    unitCost += lineCost;
    breakdown.push({
      rawMaterialId: material.id,
      name: material.name,
      quantity: item.quantity,
      unitType: recipeUnit,
      unitCost: materialUnitCostInRecipeUnit(material.unitCost, material.unitType, recipeUnit),
      lineCost,
    });
  }

  return { unitCost, breakdown };
}

export function estimateRecipeConsumption(
  recipe: RecipeItem[],
  rawMaterials: RawMaterial[],
  productionUnits: number
): Array<{ rawMaterialId: string; quantity: number }> {
  return recipe
    .filter((item) => item.quantity > 0)
    .map((item) => {
      const material = rawMaterials.find((m) => m.id === item.rawMaterialId);
      const perUnit =
        material != null
          ? recipeQuantityInMaterialUnit(
              item.quantity,
              resolveRecipeUnit(item, material.unitType),
              material.unitType
            )
          : item.quantity;
      return {
        rawMaterialId: item.rawMaterialId,
        quantity: perUnit * productionUnits,
      };
    });
}
