import type { RawMaterial, RecipeItem, RecipeItemBreakdown } from '../types';

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

    const lineCost = material.unitCost * item.quantity;
    unitCost += lineCost;
    breakdown.push({
      rawMaterialId: material.id,
      name: material.name,
      quantity: item.quantity,
      unitCost: material.unitCost,
      lineCost,
    });
  }

  return { unitCost, breakdown };
}

export function estimateRecipeConsumption(
  recipe: RecipeItem[],
  productionUnits: number
): Array<{ rawMaterialId: string; quantity: number }> {
  return recipe
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      rawMaterialId: item.rawMaterialId,
      quantity: item.quantity * productionUnits,
    }));
}
