'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GlobalFundSettings, ProductCalculation, RawMaterial } from '@/lib/domain/types';
import { recalculateInventory } from '@/lib/domain/calculations';
import { STORAGE_KEYS } from '@/lib/domain/constants';
import {
  loadFromStorage,
  migrateLegacyInventory,
  saveToStorage,
} from '@/lib/storage/local-storage';

export function useInventory() {
  const [inventory, setInventory] = useState<ProductCalculation[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadFromStorage<ProductCalculation[]>(STORAGE_KEYS.inventory, []);
    const migrated = saved.length > 0 ? saved : (migrateLegacyInventory() as ProductCalculation[]);
    setInventory(migrated);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEYS.inventory, inventory);
  }, [inventory, hydrated]);

  const saveProduct = useCallback(
    (
      product: ProductCalculation,
      rawMaterials: RawMaterial[] = [],
      globalFund?: GlobalFundSettings
    ) => {
      setInventory((prev) => {
        const exists = prev.some((item) => item.id === product.id);
        const updated = exists
          ? prev.map((item) => (item.id === product.id ? product : item))
          : [product, ...prev];
        return recalculateInventory(updated, rawMaterials, globalFund);
      });
    },
    []
  );

  const deleteProduct = useCallback(
    (id: string, rawMaterials: RawMaterial[] = [], globalFund?: GlobalFundSettings) => {
      setInventory((prev) => {
        const filtered = prev.filter((item) => item.id !== id);
        return recalculateInventory(filtered, rawMaterials, globalFund);
      });
    },
    []
  );

  const recalculateAll = useCallback(
    (rawMaterials: RawMaterial[] = [], globalFund?: GlobalFundSettings) => {
      setInventory((prev) => recalculateInventory(prev, rawMaterials, globalFund));
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
