'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GlobalFundSettings } from '@/lib/domain/types';
import { DEFAULT_GLOBAL_FUND_SETTINGS, STORAGE_KEYS } from '@/lib/domain/constants';
import { loadFromStorage, saveToStorage } from '@/lib/storage/local-storage';

export function useGlobalFund() {
  const [globalFund, setGlobalFund] = useState<GlobalFundSettings>(DEFAULT_GLOBAL_FUND_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setGlobalFund(loadFromStorage(STORAGE_KEYS.globalFund, DEFAULT_GLOBAL_FUND_SETTINGS));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEYS.globalFund, globalFund);
  }, [globalFund, hydrated]);

  const updateGlobalFund = useCallback((updates: Partial<GlobalFundSettings>) => {
    setGlobalFund((prev) => ({ ...prev, ...updates }));
  }, []);

  return { globalFund, hydrated, updateGlobalFund };
}
