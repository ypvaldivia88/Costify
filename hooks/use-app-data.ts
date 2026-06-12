'use client';

import { useEffect } from 'react';
import { useInventory } from '@/hooks/use-inventory';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { useGlobalCosts } from '@/hooks/use-global-costs';
import { useGlobalFund } from '@/hooks/use-global-fund';
import { useTaxSettings } from '@/hooks/use-tax-settings';

export function useAppData() {
  const inventoryState = useInventory();
  const rawMaterialsState = useRawMaterials();
  const globalCostsState = useGlobalCosts();
  const globalFundState = useGlobalFund();
  const taxSettingsState = useTaxSettings();

  const hydrated =
    inventoryState.hydrated &&
    rawMaterialsState.hydrated &&
    globalFundState.hydrated;

  useEffect(() => {
    if (!hydrated || inventoryState.inventory.length === 0) return;
    inventoryState.recalculateAll(rawMaterialsState.materials, globalFundState.globalFund);
  }, [globalFundState.globalFund.enabled, globalFundState.globalFund.percent, hydrated]);

  return {
    hydrated,
    inventory: inventoryState.inventory,
    materials: rawMaterialsState.materials,
    globalCosts: globalCostsState.globalCosts,
    globalFund: globalFundState.globalFund,
    taxSettings: taxSettingsState.taxSettings,
    saveProduct: inventoryState.saveProduct,
    deleteProduct: inventoryState.deleteProduct,
    recalculateAll: inventoryState.recalculateAll,
    saveMaterial: rawMaterialsState.saveMaterial,
    deleteMaterial: rawMaterialsState.deleteMaterial,
    updateStock: rawMaterialsState.updateStock,
    saveCosts: globalCostsState.saveCosts,
    updateGlobalFund: globalFundState.updateGlobalFund,
    updateTaxSettings: taxSettingsState.updateTaxSettings,
  };
}
