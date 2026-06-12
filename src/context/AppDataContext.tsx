import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type {
  GlobalFundSettings,
  IndirectCost,
  ProductCalculation,
  RawMaterial,
  RawMaterialInput,
  TaxSettings,
} from '@/domain/types';
import { useGlobalCosts } from '@/hooks/use-global-costs';
import { useGlobalFund } from '@/hooks/use-global-fund';
import { useInventory } from '@/hooks/use-inventory';
import { useRawMaterials } from '@/hooks/use-raw-materials';
import { useTaxSettings } from '@/hooks/use-tax-settings';

interface AppDataContextValue {
  hydrated: boolean;
  inventory: ProductCalculation[];
  materials: RawMaterial[];
  globalCosts: IndirectCost[];
  globalFund: GlobalFundSettings;
  taxSettings: TaxSettings;
  saveProduct: (product: ProductCalculation) => void;
  deleteProduct: (id: string) => void;
  recalculateAll: () => void;
  saveMaterial: (data: RawMaterialInput, id?: string, timestamp?: number) => void;
  deleteMaterial: (id: string) => void;
  updateStock: (id: string, stockQuantity: number) => void;
  saveCosts: (costs: IndirectCost[]) => void;
  updateGlobalFund: (updates: Partial<GlobalFundSettings>) => void;
  updateTaxSettings: (updates: Partial<TaxSettings>) => void;
  reloadFromBackup: (backup: {
    inventory: ProductCalculation[];
    rawMaterials: RawMaterial[];
    globalCosts: IndirectCost[];
    globalFund: GlobalFundSettings;
    taxSettings: TaxSettings;
  }) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const inventoryState = useInventory();
  const rawMaterialsState = useRawMaterials();
  const globalCostsState = useGlobalCosts();
  const globalFundState = useGlobalFund();
  const taxSettingsState = useTaxSettings();

  const hydrated =
    inventoryState.hydrated &&
    rawMaterialsState.hydrated &&
    globalCostsState.hydrated &&
    globalFundState.hydrated &&
    taxSettingsState.hydrated;

  useEffect(() => {
    if (!hydrated || inventoryState.inventory.length === 0) return;
    inventoryState.recalculateAll(rawMaterialsState.materials, globalFundState.globalFund);
  }, [globalFundState.globalFund.enabled, globalFundState.globalFund.percent, hydrated]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      hydrated,
      inventory: inventoryState.inventory,
      materials: rawMaterialsState.materials,
      globalCosts: globalCostsState.globalCosts,
      globalFund: globalFundState.globalFund,
      taxSettings: taxSettingsState.taxSettings,
      saveProduct: (product) =>
        inventoryState.saveProduct(
          product,
          rawMaterialsState.materials,
          globalFundState.globalFund
        ),
      deleteProduct: (id) =>
        inventoryState.deleteProduct(id, rawMaterialsState.materials, globalFundState.globalFund),
      recalculateAll: () =>
        inventoryState.recalculateAll(rawMaterialsState.materials, globalFundState.globalFund),
      saveMaterial: rawMaterialsState.saveMaterial,
      deleteMaterial: rawMaterialsState.deleteMaterial,
      updateStock: rawMaterialsState.updateStock,
      saveCosts: globalCostsState.saveCosts,
      updateGlobalFund: globalFundState.updateGlobalFund,
      updateTaxSettings: taxSettingsState.updateTaxSettings,
      reloadFromBackup: (backup) => {
        inventoryState.replaceInventory(backup.inventory);
        rawMaterialsState.replaceMaterials(backup.rawMaterials);
        globalCostsState.saveCosts(backup.globalCosts);
        globalFundState.replaceGlobalFund(backup.globalFund);
        taxSettingsState.replaceTaxSettings(backup.taxSettings);
      },
    }),
    [
      hydrated,
      inventoryState,
      rawMaterialsState,
      globalCostsState,
      globalFundState,
      taxSettingsState,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
