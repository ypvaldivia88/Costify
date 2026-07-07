import { useCallback } from 'react';
import type { LaborShareSettings } from '@costify/shared/domain/types';
import { migrateLaborShareSettings } from '@costify/shared/domain/calculations';
import { DEFAULT_LABOR_SHARE_SETTINGS, STORAGE_KEYS } from '@costify/shared/domain/constants';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

export function useLaborShareSettings() {
  const storage = useStorage();

  const load = useCallback(async () => {
    const saved = await storage.load<Partial<LaborShareSettings>>(
      STORAGE_KEYS.laborShareSettings,
      DEFAULT_LABOR_SHARE_SETTINGS
    );
    return migrateLaborShareSettings(saved);
  }, [storage]);

  const save = useCallback(
    (settings: LaborShareSettings) => storage.save(STORAGE_KEYS.laborShareSettings, settings),
    [storage]
  );

  const { value: laborShareSettings, setValue: setLaborShareSettings, hydrated } =
    useAsyncPersistedResource({
      load,
      save,
      initialValue: DEFAULT_LABOR_SHARE_SETTINGS,
    });

  const updateLaborShareSettings = useCallback(
    (updates: Partial<LaborShareSettings>) => {
      setLaborShareSettings((prev) => migrateLaborShareSettings({ ...prev, ...updates }));
    },
    [setLaborShareSettings]
  );

  const replaceLaborShareSettings = useCallback(
    (settings: LaborShareSettings) => {
      setLaborShareSettings(migrateLaborShareSettings(settings));
    },
    [setLaborShareSettings]
  );

  return {
    laborShareSettings,
    hydrated,
    updateLaborShareSettings,
    replaceLaborShareSettings,
  };
}
