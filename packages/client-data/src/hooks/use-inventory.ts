import { useCallback } from 'react';
import type {
  GlobalFundSettings,
  ProductCalculation,
  RawMaterial,
  UnitSettings,
} from '@costify/shared/domain/types';
import { recalculateInventory } from '@costify/shared/domain/calculations';
import { DEFAULT_UNIT_SETTINGS } from '@costify/shared/domain/unit-settings';
import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { migrateLegacyInventory } from '../storage/types';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

async function loadInventory(
  storage: ReturnType<typeof useStorage>
): Promise<ProductCalculation[]> {
  const saved = await storage.load<
    Array<ProductCalculation & { unitsPerPackage?: number; unitType?: string }>
  >(STORAGE_KEYS.inventory, []);
  const legacy =
    saved.length > 0 ? saved : ((await migrateLegacyInventory(storage)) as ProductCalculation[]);
  return recalculateInventory(legacy);
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
      unitSettings: UnitSettings = DEFAULT_UNIT_SETTINGS
    ) => {
      setInventory((prev) => {
        const exists = prev.some((item) => item.id === product.id);
        const updated = exists
          ? prev.map((item) => (item.id === product.id ? product : item))
          : [product, ...prev];
        return recalculateInventory(updated, rawMaterials, globalFund, unitSettings);
      });
    },
    [setInventory]
  );

  const deleteProduct = useCallback(
    (
      id: string,
      rawMaterials: RawMaterial[] = [],
      globalFund?: GlobalFundSettings,
      unitSettings: UnitSettings = DEFAULT_UNIT_SETTINGS
    ) => {
      setInventory((prev) => {
        const filtered = prev.filter((item) => item.id !== id);
        return recalculateInventory(filtered, rawMaterials, globalFund, unitSettings);
      });
    },
    [setInventory]
  );

  const recalculateAll = useCallback(
    (
      rawMaterials: RawMaterial[] = [],
      globalFund?: GlobalFundSettings,
      unitSettings: UnitSettings = DEFAULT_UNIT_SETTINGS
    ) => {
      setInventory((prev) => recalculateInventory(prev, rawMaterials, globalFund, unitSettings));
    },
    [setInventory]
  );

  const replaceInventory = useCallback(
    (items: ProductCalculation[]) => {
      setInventory(recalculateInventory(items));
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
