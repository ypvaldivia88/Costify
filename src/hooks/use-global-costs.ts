import { useCallback, useEffect, useState } from 'react';
import type { IndirectCost } from '@/domain/types';
import { STORAGE_KEYS } from '@/domain/constants';
import {
  loadFromStorage,
  migrateLegacyGlobalCosts,
  saveToStorage,
} from '@/storage/async-storage';

export function useGlobalCosts() {
  const [globalCosts, setGlobalCosts] = useState<IndirectCost[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await loadFromStorage<IndirectCost[]>(STORAGE_KEYS.globalCosts, []);
      const legacy =
        saved.length > 0 ? saved : ((await migrateLegacyGlobalCosts()) as IndirectCost[]);
      if (mounted) {
        setGlobalCosts(legacy);
        setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void saveToStorage(STORAGE_KEYS.globalCosts, globalCosts);
  }, [globalCosts, hydrated]);

  const saveCosts = useCallback((costs: IndirectCost[]) => {
    setGlobalCosts(costs);
  }, []);

  return { globalCosts, hydrated, saveCosts };
}
