'use client';

import { useCallback, useEffect, useState } from 'react';
import type { IndirectCost } from '@/lib/domain/types';
import { STORAGE_KEYS } from '@/lib/domain/constants';
import {
  loadFromStorage,
  migrateLegacyGlobalCosts,
  saveToStorage,
} from '@/lib/storage/local-storage';
import { useStorageReload } from '@/hooks/use-storage-reload';

function loadGlobalCosts(): IndirectCost[] {
  const saved = loadFromStorage<IndirectCost[]>(STORAGE_KEYS.globalCosts, []);
  return saved.length > 0 ? saved : (migrateLegacyGlobalCosts() as IndirectCost[]);
}

export function useGlobalCosts() {
  const [globalCosts, setGlobalCosts] = useState<IndirectCost[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    setGlobalCosts(loadGlobalCosts());
  }, []);

  useEffect(() => {
    reload();
    setHydrated(true);
  }, [reload]);

  useStorageReload(reload);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEYS.globalCosts, globalCosts);
  }, [globalCosts, hydrated]);

  const saveCosts = useCallback((costs: IndirectCost[]) => {
    setGlobalCosts(costs);
  }, []);

  return { globalCosts, hydrated, saveCosts };
}
