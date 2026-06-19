'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GlobalFundSettings, ProductCalculation, RawMaterial, UnitSettings } from '@/lib/domain/types';
import { recalculateInventory } from '@/lib/domain/calculations';
import { DEFAULT_UNIT_SETTINGS } from '@/lib/domain/unit-settings';
import { STORAGE_KEYS } from '@/lib/domain/constants';
import {
  loadFromStorage,
  migrateLegacyInventory,
  saveToStorage,
} from '@/lib/storage/local-storage';
import { useStorageReload } from '@/hooks/use-storage-reload';

function loadInventory(): ProductCalculation[] {
  const saved = loadFromStorage<
    Array<ProductCalculation & { unitsPerPackage?: number; unitType?: string }>
  >(STORAGE_KEYS.inventory, []);
  const legacy = saved.length > 0 ? saved : (migrateLegacyInventory() as ProductCalculation[]);
  return recalculateInventory(legacy);
}

export function useInventory() {
  const [inventory, setInventory] = useState<ProductCalculation[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    setInventory(loadInventory());
  }, []);

  useEffect(() => {
    reload();
    setHydrated(true);
  }, [reload]);

  useStorageReload(reload);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEYS.inventory, inventory);
  }, [inventory, hydrated]);

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
    []
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
    []
  );

  const recalculateAll = useCallback(
    (
      rawMaterials: RawMaterial[] = [],
      globalFund?: GlobalFundSettings,
      unitSettings: UnitSettings = DEFAULT_UNIT_SETTINGS
    ) => {
      setInventory((prev) => recalculateInventory(prev, rawMaterials, globalFund, unitSettings));
    },
    []
  );

  return {
    inventory,
    hydrated,
    saveProduct,
    deleteProduct,
    recalculateAll,
  };
}
