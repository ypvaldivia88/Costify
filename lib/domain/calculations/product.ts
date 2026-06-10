import type { ProductCalculation, ProductInput } from '../types';
import { calculateUnitDirectCost } from './direct-cost';
import { allocateIndirectCosts } from './indirect-allocation';
import {
  calculateGrossMarginPercent,
  calculateProfitPerUnit,
  calculateSuggestedPrice,
} from './pricing';

export function calculateProduct(
  input: ProductInput,
  otherProducts: ProductCalculation[],
  id?: string,
  timestamp?: number
): ProductCalculation {
  const unitCost = calculateUnitDirectCost(input.purchasePrice, input.unitsPerPackage);

  const allocation = allocateIndirectCosts(
    {
      purchasePrice: input.purchasePrice,
      unitsPerPackage: input.unitsPerPackage,
      productionUnits: input.productionUnits,
      productWeight: input.productWeight,
    },
    otherProducts,
    input.indirectCosts
  );

  const totalUnitCost = unitCost + allocation.totalPerUnit;
  const suggestedPrice = calculateSuggestedPrice(
    totalUnitCost,
    input.profitMargin,
    input.marginType
  );
  const profitPerUnit = calculateProfitPerUnit(suggestedPrice, totalUnitCost);
  const grossMarginPercent = calculateGrossMarginPercent(suggestedPrice, totalUnitCost);

  return {
    ...input,
    id: id ?? crypto.randomUUID(),
    unitCost,
    totalIndirectPerUnit: allocation.totalPerUnit,
    totalUnitCost,
    suggestedPrice,
    profitPerUnit,
    grossMarginPercent,
    indirectBreakdown: allocation.breakdown,
    timestamp: timestamp ?? Date.now(),
  };
}

export function recalculateInventory(products: ProductCalculation[]): ProductCalculation[] {
  return products.map((product) => {
    const others = products.filter((p) => p.id !== product.id);
    return calculateProduct(
      {
        name: product.name,
        purchasePrice: product.purchasePrice,
        unitsPerPackage: product.unitsPerPackage,
        productionUnits: product.productionUnits,
        productWeight: product.productWeight,
        indirectCosts: product.indirectCosts,
        profitMargin: product.profitMargin,
        marginType: product.marginType ?? 'markup',
      },
      others,
      product.id,
      product.timestamp
    );
  });
}
