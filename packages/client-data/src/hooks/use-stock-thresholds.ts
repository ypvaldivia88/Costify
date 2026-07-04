import { useCallback } from 'react';
import type { StockThreshold } from '@costify/shared/domain/types';
import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { randomId } from '@costify/shared/random-id';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

export function useStockThresholds() {
  const storage = useStorage();

  const load = useCallback(
    () => storage.load<StockThreshold[]>(STORAGE_KEYS.stockThresholds, []),
    [storage]
  );
  const save = useCallback(
    (thresholds: StockThreshold[]) => storage.save(STORAGE_KEYS.stockThresholds, thresholds),
    [storage]
  );

  const { value: thresholds, setValue: setThresholds, hydrated } = useAsyncPersistedResource({
    load,
    save,
    initialValue: [] as StockThreshold[],
  });

  const saveThreshold = useCallback(
    (input: Omit<StockThreshold, 'id'>, id?: string) => {
      const threshold: StockThreshold = { ...input, id: id ?? randomId() };
      setThresholds((prev) => {
        const exists = prev.some((t) => t.id === threshold.id);
        return exists
          ? prev.map((t) => (t.id === threshold.id ? threshold : t))
          : [threshold, ...prev];
      });
      return threshold;
    },
    [setThresholds]
  );

  const deleteThreshold = useCallback(
    (id: string) => {
      setThresholds((prev) => prev.filter((t) => t.id !== id));
    },
    [setThresholds]
  );

  const setThresholdsDirect = useCallback(
    (next: StockThreshold[]) => {
      setThresholds(next);
    },
    [setThresholds]
  );

  return {
    thresholds,
    hydrated,
    saveThreshold,
    deleteThreshold,
    setThresholdsDirect,
  };
}
