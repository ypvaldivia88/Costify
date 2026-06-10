'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProductCalculation } from '@/lib/domain/types';
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

  const saveProduct = useCallback((product: ProductCalculation) => {
    setInventory((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      const updated = exists
        ? prev.map((item) => (item.id === product.id ? product : item))
        : [product, ...prev];
      return recalculateInventory(updated);
    });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setInventory((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return recalculateInventory(filtered);
    });
  }, []);

  const recalculateAll = useCallback(() => {
    setInventory((prev) => recalculateInventory(prev));
  }, []);

  return {
    inventory,
    hydrated,
    saveProduct,
    deleteProduct,
    recalculateAll,
  };
}
