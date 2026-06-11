import type { GlobalFundSettings, ProductCalculation, ProductInput, RawMaterial, UnitType } from '../types';
import { calculateUnitDirectCost } from './direct-cost';
import { applyGlobalFund } from './global-fund';
import { allocateIndirectCosts } from './indirect-allocation';
import {
  calculateGrossMarginPercent,
  calculateProfitPerUnit,
  calculateSuggestedPrice,
} from './pricing';
import { calculateRecipeUnitCost } from './recipe-cost';

type LegacyProductInput = Partial<ProductInput> & { unitsPerPackage?: number };

export function migrateProductInput(product: LegacyProductInput): ProductInput {
  return {
    name: product.name ?? '',
    productType: product.productType ?? 'simple',
    purchasePrice: product.purchasePrice ?? 0,
    unitType: product.unitType ?? 'ud',
    packageQuantity: product.packageQuantity ?? product.unitsPerPackage ?? 1,
    recipe: product.recipe,
    productionUnits: product.productionUnits ?? 1,
    productWeight: product.productWeight,
    indirectCosts: product.indirectCosts ?? [],
    profitMargin: product.profitMargin ?? 0,
    marginType: product.marginType ?? 'markup',
  };
}

function resolveDirectCost(
  input: ProductInput,
  rawMaterials: RawMaterial[]
): {
  unitCost: number;
  purchasePrice: number;
  unitType: UnitType;
  packageQuantity: number;
  recipeBreakdown?: ProductCalculation['recipeBreakdown'];
} {
  if (input.productType === 'elaborated' && input.recipe && input.recipe.length > 0) {
    const { unitCost, breakdown } = calculateRecipeUnitCost(input.recipe, rawMaterials);
    return {
      unitCost,
      purchasePrice: unitCost,
      unitType: input.unitType ?? 'ud',
      packageQuantity: 1,
      recipeBreakdown: breakdown,
    };
  }

  const unitCost = calculateUnitDirectCost(input.purchasePrice, input.packageQuantity);
  return {
    unitCost,
    purchasePrice: input.purchasePrice,
    unitType: input.unitType,
    packageQuantity: input.packageQuantity,
  };
}

export function calculateProduct(
  input: ProductInput,
  otherProducts: ProductCalculation[],
  rawMaterials: RawMaterial[] = [],
  globalFund?: GlobalFundSettings,
  id?: string,
  timestamp?: number
): ProductCalculation {
  const direct = resolveDirectCost(input, rawMaterials);
  const effectiveIndirectCosts = applyGlobalFund(input.indirectCosts, globalFund);

  const allocation = allocateIndirectCosts(
    {
      purchasePrice: direct.purchasePrice,
      packageQuantity: direct.packageQuantity,
      productionUnits: input.productionUnits,
      productWeight: input.productWeight,
      unitDirectCost: direct.unitCost,
    },
    otherProducts,
    effectiveIndirectCosts
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
    unitType: direct.unitType,
    packageQuantity: direct.packageQuantity,
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
  rawMaterials: RawMaterial[] = [],
  globalFund?: GlobalFundSettings
): ProductCalculation[] {
  return products.map((product) => {
    const others = products.filter((p) => p.id !== product.id);
    return calculateProduct(
      migrateProductInput(product),
      others,
      rawMaterials,
      globalFund,
      product.id,
      product.timestamp
    );
  });
}
