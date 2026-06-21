'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GlobalFundSettings } from '@/lib/domain/types';
import { migrateGlobalFundSettings } from '@/lib/domain/calculations';
import { DEFAULT_GLOBAL_FUND_SETTINGS, STORAGE_KEYS } from '@/lib/domain/constants';
import { loadFromStorage, saveToStorage } from '@/lib/storage/local-storage';
import { useStorageReload } from '@/hooks/use-storage-reload';

function loadGlobalFund(): GlobalFundSettings {
  const saved = loadFromStorage<
    Partial<GlobalFundSettings> & { amount?: number; distributionCriteria?: string }
  >(STORAGE_KEYS.globalFund, DEFAULT_GLOBAL_FUND_SETTINGS);
  return migrateGlobalFundSettings(saved);
}

export function useGlobalFund() {
  const [globalFund, setGlobalFund] = useState<GlobalFundSettings>(DEFAULT_GLOBAL_FUND_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    setGlobalFund(loadGlobalFund());
  }, []);

  useEffect(() => {
    reload();
    setHydrated(true);
  }, [reload]);

  useStorageReload(reload);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEYS.globalFund, globalFund);
  }, [globalFund, hydrated]);

  const updateGlobalFund = useCallback((updates: Partial<GlobalFundSettings>) => {
    setGlobalFund((prev) => ({ ...prev, ...updates }));
  }, []);

  return { globalFund, hydrated, updateGlobalFund };
}
