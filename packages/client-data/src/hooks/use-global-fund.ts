import { useCallback } from 'react';
import type { GlobalFundSettings } from '@costify/shared/domain/types';
import { migrateGlobalFundSettings } from '@costify/shared/domain/calculations';
import { DEFAULT_GLOBAL_FUND_SETTINGS, STORAGE_KEYS } from '@costify/shared/domain/constants';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

export function useGlobalFund() {
  const storage = useStorage();

  const load = useCallback(async () => {
    const saved = await storage.load<
      Partial<GlobalFundSettings> & { amount?: number; distributionCriteria?: string }
    >(STORAGE_KEYS.globalFund, DEFAULT_GLOBAL_FUND_SETTINGS);
    return migrateGlobalFundSettings(saved);
  }, [storage]);

  const save = useCallback(
    (globalFund: GlobalFundSettings) => storage.save(STORAGE_KEYS.globalFund, globalFund),
    [storage]
  );

  const { value: globalFund, setValue: setGlobalFund, hydrated } = useAsyncPersistedResource({
    load,
    save,
    initialValue: DEFAULT_GLOBAL_FUND_SETTINGS,
  });

  const updateGlobalFund = useCallback(
    (updates: Partial<GlobalFundSettings>) => {
      setGlobalFund((prev) => ({ ...prev, ...updates }));
    },
    [setGlobalFund]
  );

  const replaceGlobalFund = useCallback(
    (settings: GlobalFundSettings) => {
      setGlobalFund(migrateGlobalFundSettings(settings));
    },
    [setGlobalFund]
  );

  return { globalFund, hydrated, updateGlobalFund, replaceGlobalFund };
}
