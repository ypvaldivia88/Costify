'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Warehouse } from '@/lib/domain/types';
import { buildWarehouse } from '@/lib/domain/calculations';
import { STORAGE_KEYS } from '@/lib/domain/constants';
import { loadFromStorage, saveToStorage } from '@/lib/storage/local-storage';
import { useStorageReload } from '@/hooks/use-storage-reload';

function loadWarehouses(): Warehouse[] {
  return loadFromStorage<Warehouse[]>(STORAGE_KEYS.warehouses, []);
}

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    setWarehouses(loadWarehouses());
  }, []);

  useEffect(() => {
    reload();
    setHydrated(true);
  }, [reload]);

  useStorageReload(reload);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEYS.warehouses, warehouses);
  }, [warehouses, hydrated]);

  const saveWarehouse = useCallback(
    (input: Omit<Warehouse, 'id' | 'timestamp'>, id?: string, timestamp?: number) => {
      const warehouse = buildWarehouse(input, id, timestamp);
      setWarehouses((prev) => {
        const exists = prev.some((w) => w.id === warehouse.id);
        return exists
          ? prev.map((w) => (w.id === warehouse.id ? warehouse : w))
          : [warehouse, ...prev];
      });
      return warehouse;
    },
    []
  );

  const deleteWarehouse = useCallback((id: string) => {
    setWarehouses((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const setWarehousesDirect = useCallback((next: Warehouse[]) => {
    setWarehouses(next);
  }, []);

  return {
    warehouses,
    hydrated,
    saveWarehouse,
    deleteWarehouse,
    setWarehousesDirect,
  };
}
