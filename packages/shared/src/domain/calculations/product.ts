import type {
  GlobalFundSettings,
  LaborShareBreakdownItem,
  LaborShareSettings,
  ProductCalculation,
  ProductInput,
  RawMaterial,
  UnitSettings,
} from '../types';
import { calculateUnitDirectCost } from './direct-cost';
import { calculateGlobalFundPerUnit } from './global-fund';
import { allocateIndirectCosts } from './indirect-allocation';
import {
  getActiveLaborRoles,
  getTotalLaborSharePercent,
} from './labor-share';
import { migrateProductInput, normalizePurchaseUnit } from './product-migration';
import {
  calculateGrossMarginPercent,
  calculateProfitPerUnit,
  calculateSuggestedPrice,
  calculateSuggestedPriceWithLaborShare,
} from './pricing';
import { calculateRecipeUnitCost } from './recipe-cost';
import { DEFAULT_UNIT_SETTINGS } from '../unit-settings';
import { randomId } from '../../random-id';

export { migrateProductInput } from './product-migration';

function resolveDirectCost(
  input: ProductInput,
  rawMaterials: RawMaterial[],
  unitSettings: UnitSettings = DEFAULT_UNIT_SETTINGS
): {
  unitCost: number;
  purchasePrice: number;
  purchaseUnit: string;
  packageQuantity: number;
  recipeBreakdown?: ProductCalculation['recipeBreakdown'];
} {
  if (input.productType === 'elaborated' && input.recipe && input.recipe.length > 0) {
    const { unitCost, breakdown } = calculateRecipeUnitCost(input.recipe, rawMaterials, unitSettings);
    return {
      unitCost,
      purchasePrice: unitCost,
      purchaseUnit: normalizePurchaseUnit(input.purchaseUnit, undefined, unitSettings),
      packageQuantity: 1,
      recipeBreakdown: breakdown,
    };
  }

  const unitCost = calculateUnitDirectCost(input.purchasePrice, input.packageQuantity);
  return {
    unitCost,
    purchasePrice: input.purchasePrice,
    purchaseUnit: normalizePurchaseUnit(input.purchaseUnit, undefined, unitSettings),
    packageQuantity: input.packageQuantity,
  };
}

export function calculateProduct(
  input: ProductInput,
  otherProducts: ProductCalculation[],
  rawMaterials: RawMaterial[] = [],
  globalFund?: GlobalFundSettings,
  id?: string,
  timestamp?: number,
  unitSettings: UnitSettings = DEFAULT_UNIT_SETTINGS,
  laborShareSettings?: LaborShareSettings
): ProductCalculation {
  const direct = resolveDirectCost(input, rawMaterials, unitSettings);

  const allocation = allocateIndirectCosts(
    {
      purchasePrice: direct.purchasePrice,
      packageQuantity: direct.packageQuantity,
      productionUnits: input.productionUnits,
      productWeight: input.productWeight,
      unitDirectCost: direct.unitCost,
    },
    otherProducts,
    input.indirectCosts
  );

  const globalFundPerUnit = calculateGlobalFundPerUnit(direct.unitCost, globalFund);
  const totalIndirectPerUnit = allocation.totalPerUnit + globalFundPerUnit;

  const indirectBreakdown = [...allocation.breakdown];
  if (globalFundPerUnit > 0 && globalFund?.enabled) {
    indirectBreakdown.unshift({
      name: globalFund.name.trim() || 'Fondo global',
      assigned: globalFundPerUnit * input.productionUnits,
      perUnit: globalFundPerUnit,
      criteria: 'direct-cost',
    });
  }

  const totalUnitCost = direct.unitCost + totalIndirectPerUnit;
  const activeLaborRoles = getActiveLaborRoles(input, laborShareSettings);
  const totalLaborSharePercent = getTotalLaborSharePercent(activeLaborRoles);

  const suggestedPrice =
    totalLaborSharePercent > 0
      ? calculateSuggestedPriceWithLaborShare(
          totalUnitCost,
          input.profitMargin,
          input.marginType,
          totalLaborSharePercent
        )
      : calculateSuggestedPrice(totalUnitCost, input.profitMargin, input.marginType);

  const laborShareBreakdown: LaborShareBreakdownItem[] = activeLaborRoles.map((role) => ({
    roleId: role.id,
    name: role.name,
    percentOfSale: role.percentOfSale,
    perUnit: suggestedPrice * (role.percentOfSale / 100),
  }));
  const totalLaborSharePerUnit = laborShareBreakdown.reduce((sum, item) => sum + item.perUnit, 0);

  const profitPerUnit = calculateProfitPerUnit(
    suggestedPrice,
    totalUnitCost + totalLaborSharePerUnit
  );
  const grossMarginPercent = calculateGrossMarginPercent(
    suggestedPrice,
    totalUnitCost + totalLaborSharePerUnit
  );

  return {
    ...input,
    productType: input.productType ?? 'simple',
    purchasePrice: direct.purchasePrice,
    purchaseUnit: direct.purchaseUnit,
    packageQuantity: direct.packageQuantity,
    id: id ?? randomId(),
    unitCost: direct.unitCost,
    totalIndirectPerUnit,
    totalUnitCost,
    totalLaborSharePerUnit,
    totalLaborSharePercent,
    laborShareBreakdown,
    suggestedPrice,
    profitPerUnit,
    grossMarginPercent,
    indirectBreakdown,
    recipeBreakdown: direct.recipeBreakdown,
    timestamp: timestamp ?? Date.now(),
  };
}

export function recalculateInventory(
  products: ProductCalculation[],
  rawMaterials: RawMaterial[] = [],
  globalFund?: GlobalFundSettings,
  unitSettings: UnitSettings = DEFAULT_UNIT_SETTINGS,
  laborShareSettings?: LaborShareSettings
): ProductCalculation[] {
  return products.map((product) => {
    const others = products.filter((p) => p.id !== product.id);
    return calculateProduct(
      migrateProductInput(product, unitSettings),
      others,
      rawMaterials,
      globalFund,
      product.id,
      product.timestamp,
      unitSettings,
      laborShareSettings
    );
  });
}
