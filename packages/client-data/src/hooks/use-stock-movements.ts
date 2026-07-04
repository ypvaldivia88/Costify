import { useCallback } from 'react';
import type { StockMovement } from '@costify/shared/domain/types';
import { buildStockMovement, validateMovementStock } from '@costify/shared/domain/calculations';
import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

export function useStockMovements() {
  const storage = useStorage();

  const load = useCallback(
    () => storage.load<StockMovement[]>(STORAGE_KEYS.stockMovements, []),
    [storage]
  );
  const save = useCallback(
    (movements: StockMovement[]) => storage.save(STORAGE_KEYS.stockMovements, movements),
    [storage]
  );

  const { value: movements, setValue: setMovements, hydrated } = useAsyncPersistedResource({
    load,
    save,
    initialValue: [] as StockMovement[],
  });

  const addMovement = useCallback(
    (input: Omit<StockMovement, 'id' | 'timestamp'>, id?: string, timestamp?: number) => {
      const error = validateMovementStock(input, movements);
      if (error) throw new Error(error);

      const movement = buildStockMovement(input, id, timestamp);
      setMovements((prev) => [movement, ...prev].sort((a, b) => b.timestamp - a.timestamp));
      return movement;
    },
    [movements, setMovements]
  );

  const setMovementsDirect = useCallback(
    (next: StockMovement[]) => {
      setMovements(next.sort((a, b) => b.timestamp - a.timestamp));
    },
    [setMovements]
  );

  const deleteMovement = useCallback(
    (id: string) => {
      setMovements((prev) => prev.filter((m) => m.id !== id));
    },
    [setMovements]
  );

  return {
    movements,
    hydrated,
    addMovement,
    deleteMovement,
    setMovementsDirect,
  };
}
