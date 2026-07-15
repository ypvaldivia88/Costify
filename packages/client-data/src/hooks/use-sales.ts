import { useCallback } from 'react';
import type { SaleRecord } from '@costify/shared/domain/sales';
import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { randomId } from '@costify/shared/random-id';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

export function useSales() {
  const storage = useStorage();
  const load = useCallback(() => storage.load<SaleRecord[]>(STORAGE_KEYS.sales, []), [storage]);
  const save = useCallback(
    (sales: SaleRecord[]) => storage.save(STORAGE_KEYS.sales, sales),
    [storage]
  );

  const { value: sales, setValue: setSales, hydrated } = useAsyncPersistedResource({
    load,
    save,
    initialValue: [] as SaleRecord[],
  });

  const addSales = useCallback(
    (records: SaleRecord[]) => {
      setSales((prev) => [...records, ...prev]);
    },
    [setSales]
  );

  const setSalesDirect = useCallback(
    (next: SaleRecord[]) => {
      setSales(next);
    },
    [setSales]
  );

  const createSaleId = useCallback(() => randomId(), []);

  return {
    sales,
    hydrated,
    addSales,
    setSalesDirect,
    createSaleId,
  };
}
