import type { ProductCalculation, ProductInput, RawMaterial } from '../types';
import { calculateUnitDirectCost } from './direct-cost';
import { allocateIndirectCosts } from './indirect-allocation';
import {
  calculateGrossMarginPercent,
  calculateProfitPerUnit,
  calculateSuggestedPrice,
} from './pricing';
import { calculateRecipeUnitCost } from './recipe-cost';

function resolveDirectCost(
  input: ProductInput,
  rawMaterials: RawMaterial[]
): { unitCost: number; purchasePrice: number; unitsPerPackage: number; recipeBreakdown?: ProductCalculation['recipeBreakdown'] } {
  if (input.productType === 'elaborated' && input.recipe && input.recipe.length > 0) {
    const { unitCost, breakdown } = calculateRecipeUnitCost(input.recipe, rawMaterials);
    return {
      unitCost,
      purchasePrice: unitCost,
      unitsPerPackage: 1,
      recipeBreakdown: breakdown,
    };
  }

  const unitCost = calculateUnitDirectCost(input.purchasePrice, input.unitsPerPackage);
  return {
    unitCost,
    purchasePrice: input.purchasePrice,
    unitsPerPackage: input.unitsPerPackage,
  };
}

export function calculateProduct(
  input: ProductInput,
  otherProducts: ProductCalculation[],
  rawMaterials: RawMaterial[] = [],
  id?: string,
  timestamp?: number
): ProductCalculation {
  const direct = resolveDirectCost(input, rawMaterials);

  const allocation = allocateIndirectCosts(
    {
      purchasePrice: direct.purchasePrice,
      unitsPerPackage: direct.unitsPerPackage,
      productionUnits: input.productionUnits,
      productWeight: input.productWeight,
      unitDirectCost: direct.unitCost,
    },
    otherProducts,
    input.indirectCosts
  );

  const totalUnitCost = direct.unitCost + allocation.totalPerUnit;
  const suggestedPrice = calculateSuggestedPrice(
    totalUnitCost,
    input.profitMargin,
    input.marginType
  );
  const profitPerUnit = calculateProfitPerUnit(suggestedPrice, totalUnitCost);
  const grossMarginPercent = calculateGrossMarginPercent(suggestedPrice, totalUnitCost);

  return {
    ...input,
    productType: input.productType ?? 'simple',
    purchasePrice: direct.purchasePrice,
    unitsPerPackage: direct.unitsPerPackage,
    id: id ?? crypto.randomUUID(),
    unitCost: direct.unitCost,
    totalIndirectPerUnit: allocation.totalPerUnit,
    totalUnitCost,
    suggestedPrice,
    profitPerUnit,
    grossMarginPercent,
    indirectBreakdown: allocation.breakdown,
    recipeBreakdown: direct.recipeBreakdown,
    timestamp: timestamp ?? Date.now(),
  };
}

export function recalculateInventory(
  products: ProductCalculation[],
  rawMaterials: RawMaterial[] = []
): ProductCalculation[] {
  return products.map((product) => {
    const others = products.filter((p) => p.id !== product.id);
    return calculateProduct(
      {
        name: product.name,
        productType: product.productType ?? 'simple',
        purchasePrice: product.purchasePrice,
        unitsPerPackage: product.unitsPerPackage,
        recipe: product.recipe,
        productionUnits: product.productionUnits,
        productWeight: product.productWeight,
        indirectCosts: product.indirectCosts,
        profitMargin: product.profitMargin,
        marginType: product.marginType ?? 'markup',
      },
      others,
      rawMaterials,
      product.id,
      product.timestamp
    );
  });
}
