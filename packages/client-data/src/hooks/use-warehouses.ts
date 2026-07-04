import { useCallback } from 'react';
import type { Warehouse } from '@costify/shared/domain/types';
import { buildWarehouse } from '@costify/shared/domain/calculations';
import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

export function useWarehouses() {
  const storage = useStorage();
  const load = useCallback(
    () => storage.load<Warehouse[]>(STORAGE_KEYS.warehouses, []),
    [storage]
  );
  const save = useCallback(
    (warehouses: Warehouse[]) => storage.save(STORAGE_KEYS.warehouses, warehouses),
    [storage]
  );

  const { value: warehouses, setValue: setWarehouses, hydrated } = useAsyncPersistedResource({
    load,
    save,
    initialValue: [] as Warehouse[],
  });

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
    [setWarehouses]
  );

  const deleteWarehouse = useCallback(
    (id: string) => {
      setWarehouses((prev) => prev.filter((w) => w.id !== id));
    },
    [setWarehouses]
  );

  const setWarehousesDirect = useCallback(
    (next: Warehouse[]) => {
      setWarehouses(next);
    },
    [setWarehouses]
  );

  return {
    warehouses,
    hydrated,
    saveWarehouse,
    deleteWarehouse,
    setWarehousesDirect,
  };
}
