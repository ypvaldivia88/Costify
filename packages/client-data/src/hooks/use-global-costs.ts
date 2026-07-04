import { useCallback } from 'react';
import type { IndirectCost } from '@costify/shared/domain/types';
import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { migrateLegacyGlobalCosts } from '../storage/types';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

export function useGlobalCosts() {
  const storage = useStorage();

  const load = useCallback(async () => {
    const saved = await storage.load<IndirectCost[]>(STORAGE_KEYS.globalCosts, []);
    return saved.length > 0 ? saved : ((await migrateLegacyGlobalCosts(storage)) as IndirectCost[]);
  }, [storage]);

  const save = useCallback(
    (globalCosts: IndirectCost[]) => storage.save(STORAGE_KEYS.globalCosts, globalCosts),
    [storage]
  );

  const { value: globalCosts, setValue: setGlobalCosts, hydrated } = useAsyncPersistedResource({
    load,
    save,
    initialValue: [] as IndirectCost[],
  });

  const saveCosts = useCallback(
    (costs: IndirectCost[]) => {
      setGlobalCosts(costs);
    },
    [setGlobalCosts]
  );

  return { globalCosts, hydrated, saveCosts };
}
