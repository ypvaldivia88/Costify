'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StockMovement } from '@/lib/domain/types';
import { buildStockMovement, validateMovementStock } from '@/lib/domain/calculations';
import { STORAGE_KEYS } from '@/lib/domain/constants';
import { loadFromStorage, saveToStorage } from '@/lib/storage/local-storage';
import { useStorageReload } from '@/hooks/use-storage-reload';

function loadMovements(): StockMovement[] {
  return loadFromStorage<StockMovement[]>(STORAGE_KEYS.stockMovements, []);
}

export function useStockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    setMovements(loadMovements());
  }, []);

  useEffect(() => {
    reload();
    setHydrated(true);
  }, [reload]);

  useStorageReload(reload);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEYS.stockMovements, movements);
  }, [movements, hydrated]);

  const addMovement = useCallback(
    (input: Omit<StockMovement, 'id' | 'timestamp'>, id?: string, timestamp?: number) => {
      const error = validateMovementStock(input, movements);
      if (error) throw new Error(error);

      const movement = buildStockMovement(input, id, timestamp);
      setMovements((prev) => [movement, ...prev].sort((a, b) => b.timestamp - a.timestamp));
      return movement;
    },
    [movements]
  );

  const setMovementsDirect = useCallback((next: StockMovement[]) => {
    setMovements(next.sort((a, b) => b.timestamp - a.timestamp));
  }, []);

  const deleteMovement = useCallback((id: string) => {
    setMovements((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return {
    movements,
    hydrated,
    addMovement,
    deleteMovement,
    setMovementsDirect,
  };
}
