'use client';

import { useEffect, useMemo } from 'react';
import { useInventory } from '@/hooks/use-inventory';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { useGlobalCosts } from '@/hooks/use-global-costs';
import { useGlobalFund } from '@/hooks/use-global-fund';
import { useTaxSettings } from '@/hooks/use-tax-settings';
import { useUnitSettings } from '@/hooks/use-unit-settings';
import { useCloudSync } from '@/hooks/use-cloud-sync';

export function useAppData() {
  const inventoryState = useInventory();
  const rawMaterialsState = useRawMaterials();
  const globalCostsState = useGlobalCosts();
  const globalFundState = useGlobalFund();
  const taxSettingsState = useTaxSettings();
  const unitSettingsState = useUnitSettings();

  const hydrated =
    inventoryState.hydrated &&
    rawMaterialsState.hydrated &&
    globalCostsState.hydrated &&
    globalFundState.hydrated &&
    taxSettingsState.hydrated &&
    unitSettingsState.hydrated;

  const syncData = useMemo(
    () => ({
      inventory: inventoryState.inventory,
      rawMaterials: rawMaterialsState.materials,
      globalCosts: globalCostsState.globalCosts,
      globalFund: globalFundState.globalFund,
      taxSettings: taxSettingsState.taxSettings,
      unitSettings: unitSettingsState.unitSettings,
    }),
    [
      inventoryState.inventory,
      rawMaterialsState.materials,
      globalCostsState.globalCosts,
      globalFundState.globalFund,
      taxSettingsState.taxSettings,
      unitSettingsState.unitSettings,
    ]
  );

  const cloudSync = useCloudSync({ enabled: hydrated, data: syncData });

  useEffect(() => {
    if (!hydrated || inventoryState.inventory.length === 0) return;
    inventoryState.recalculateAll(
      rawMaterialsState.materials,
      globalFundState.globalFund,
      unitSettingsState.unitSettings
    );
  }, [
    globalFundState.globalFund.enabled,
    globalFundState.globalFund.percent,
    unitSettingsState.unitSettings,
    hydrated,
  ]);

  return {
    hydrated,
    inventory: inventoryState.inventory,
    materials: rawMaterialsState.materials,
    globalCosts: globalCostsState.globalCosts,
    globalFund: globalFundState.globalFund,
    taxSettings: taxSettingsState.taxSettings,
    unitSettings: unitSettingsState.unitSettings,
    cloudSync,
    saveProduct: inventoryState.saveProduct,
    deleteProduct: inventoryState.deleteProduct,
    recalculateAll: inventoryState.recalculateAll,
    saveMaterial: rawMaterialsState.saveMaterial,
    deleteMaterial: rawMaterialsState.deleteMaterial,
    updateStock: rawMaterialsState.updateStock,
    saveCosts: globalCostsState.saveCosts,
    updateGlobalFund: globalFundState.updateGlobalFund,
    updateTaxSettings: taxSettingsState.updateTaxSettings,
    saveUnitSettings: unitSettingsState.updateUnitSettings,
    resetUnitSettings: unitSettingsState.resetUnitSettings,
  };
}
