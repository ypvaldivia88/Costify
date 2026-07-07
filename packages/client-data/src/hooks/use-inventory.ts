import { useCallback } from 'react';
import type {
  GlobalFundSettings,
  LaborShareSettings,
  ProductCalculation,
  RawMaterial,
  UnitSettings,
} from '@costify/shared/domain/types';
import { recalculateInventory } from '@costify/shared/domain/calculations';
import { migrateGlobalFundSettings } from '@costify/shared/domain/calculations/global-fund';
import { migrateLaborShareSettings } from '@costify/shared/domain/calculations/labor-share';
import {
  DEFAULT_GLOBAL_FUND_SETTINGS,
  DEFAULT_LABOR_SHARE_SETTINGS,
  STORAGE_KEYS,
} from '@costify/shared/domain/constants';
import { DEFAULT_UNIT_SETTINGS, migrateUnitSettings } from '@costify/shared/domain/unit-settings';
import { migrateLegacyInventory } from '../storage/types';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

async function loadInventory(
  storage: ReturnType<typeof useStorage>
): Promise<ProductCalculation[]> {
  const [saved, rawMaterials, globalFund, unitSettings, laborShareSettings] = await Promise.all([
    storage.load<Array<ProductCalculation & { unitsPerPackage?: number; unitType?: string }>>(
      STORAGE_KEYS.inventory,
      []
    ),
    storage.load<RawMaterial[]>(STORAGE_KEYS.rawMaterials, []),
    storage.load(STORAGE_KEYS.globalFund, DEFAULT_GLOBAL_FUND_SETTINGS),
    storage.load(STORAGE_KEYS.unitSettings, undefined),
    storage.load(STORAGE_KEYS.laborShareSettings, DEFAULT_LABOR_SHARE_SETTINGS),
  ]);

  const legacy =
    saved.length > 0 ? saved : ((await migrateLegacyInventory(storage)) as ProductCalculation[]);

  return recalculateInventory(
    legacy,
    rawMaterials,
    migrateGlobalFundSettings(globalFund),
    migrateUnitSettings(unitSettings),
    migrateLaborShareSettings(laborShareSettings)
  );
}

export function useInventory() {
  const storage = useStorage();

  const load = useCallback(() => loadInventory(storage), [storage]);
  const save = useCallback(
    (inventory: ProductCalculation[]) => storage.save(STORAGE_KEYS.inventory, inventory),
    [storage]
  );

  const { value: inventory, setValue: setInventory, hydrated } = useAsyncPersistedResource({
    load,
    save,
    initialValue: [] as ProductCalculation[],
  });

  const saveProduct = useCallback(
    (
      product: ProductCalculation,
      rawMaterials: RawMaterial[] = [],
      globalFund?: GlobalFundSettings,
      unitSettings: UnitSettings = DEFAULT_UNIT_SETTINGS,
      laborShareSettings: LaborShareSettings = DEFAULT_LABOR_SHARE_SETTINGS
    ) => {
      setInventory((prev) => {
        const exists = prev.some((item) => item.id === product.id);
        const updated = exists
          ? prev.map((item) => (item.id === product.id ? product : item))
          : [product, ...prev];
        return recalculateInventory(
          updated,
          rawMaterials,
          globalFund,
          unitSettings,
          laborShareSettings
        );
      });
    },
    [setInventory]
  );

  const deleteProduct = useCallback(
    (
      id: string,
      rawMaterials: RawMaterial[] = [],
      globalFund?: GlobalFundSettings,
      unitSettings: UnitSettings = DEFAULT_UNIT_SETTINGS,
      laborShareSettings: LaborShareSettings = DEFAULT_LABOR_SHARE_SETTINGS
    ) => {
      setInventory((prev) => {
        const filtered = prev.filter((item) => item.id !== id);
        return recalculateInventory(
          filtered,
          rawMaterials,
          globalFund,
          unitSettings,
          laborShareSettings
        );
      });
    },
    [setInventory]
  );

  const recalculateAll = useCallback(
    (
      rawMaterials: RawMaterial[] = [],
      globalFund?: GlobalFundSettings,
      unitSettings: UnitSettings = DEFAULT_UNIT_SETTINGS,
      laborShareSettings: LaborShareSettings = DEFAULT_LABOR_SHARE_SETTINGS
    ) => {
      setInventory((prev) =>
        recalculateInventory(prev, rawMaterials, globalFund, unitSettings, laborShareSettings)
      );
    },
    [setInventory]
  );

  const replaceInventory = useCallback(
    (
      items: ProductCalculation[],
      rawMaterials: RawMaterial[] = [],
      globalFund?: GlobalFundSettings,
      unitSettings: UnitSettings = DEFAULT_UNIT_SETTINGS,
      laborShareSettings: LaborShareSettings = DEFAULT_LABOR_SHARE_SETTINGS
    ) => {
      setInventory(
        recalculateInventory(items, rawMaterials, globalFund, unitSettings, laborShareSettings)
      );
    },
    [setInventory]
  );

  return {
    inventory,
    hydrated,
    saveProduct,
    deleteProduct,
    recalculateAll,
    replaceInventory,
  };
}
