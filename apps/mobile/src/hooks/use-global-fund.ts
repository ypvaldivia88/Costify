import { useCallback, useEffect, useState } from 'react';
import type { GlobalFundSettings } from '@costify/shared/domain/types';
import { migrateGlobalFundSettings } from '@costify/shared/domain/calculations/global-fund';
import { DEFAULT_GLOBAL_FUND_SETTINGS, STORAGE_KEYS } from '@costify/shared/domain/constants';
import { loadFromStorage, saveToStorage } from '@/storage/async-storage';

export function useGlobalFund() {
  const [globalFund, setGlobalFund] = useState<GlobalFundSettings>(DEFAULT_GLOBAL_FUND_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await loadFromStorage<GlobalFundSettings>(
        STORAGE_KEYS.globalFund,
        DEFAULT_GLOBAL_FUND_SETTINGS
      );
      if (mounted) {
        setGlobalFund(migrateGlobalFundSettings(saved));
        setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void saveToStorage(STORAGE_KEYS.globalFund, globalFund);
  }, [globalFund, hydrated]);

  const updateGlobalFund = useCallback((updates: Partial<GlobalFundSettings>) => {
    setGlobalFund((prev) => migrateGlobalFundSettings({ ...prev, ...updates }));
  }, []);

  const replaceGlobalFund = useCallback((settings: GlobalFundSettings) => {
    setGlobalFund(migrateGlobalFundSettings(settings));
  }, []);

  return { globalFund, hydrated, updateGlobalFund, replaceGlobalFund };
}
