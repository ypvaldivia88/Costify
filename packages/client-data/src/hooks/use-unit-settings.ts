import { useCallback } from 'react';
import type { UnitSettings } from '@costify/shared/domain/types';
import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { DEFAULT_UNIT_SETTINGS, migrateUnitSettings } from '@costify/shared/domain/unit-settings';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

export function useUnitSettings() {
  const storage = useStorage();

  const load = useCallback(async () => {
    const saved = await storage.load<unknown>(STORAGE_KEYS.unitSettings, null);
    return saved ? migrateUnitSettings(saved) : DEFAULT_UNIT_SETTINGS;
  }, [storage]);

  const save = useCallback(
    (unitSettings: UnitSettings) => storage.save(STORAGE_KEYS.unitSettings, unitSettings),
    [storage]
  );

  const { value: unitSettings, setValue: setUnitSettings, hydrated } = useAsyncPersistedResource({
    load,
    save,
    initialValue: DEFAULT_UNIT_SETTINGS,
  });

  const updateUnitSettings = useCallback(
    (settings: UnitSettings) => {
      setUnitSettings(migrateUnitSettings(settings));
    },
    [setUnitSettings]
  );

  const replaceUnitSettings = useCallback(
    (settings: UnitSettings) => {
      setUnitSettings(migrateUnitSettings(settings));
    },
    [setUnitSettings]
  );

  const resetUnitSettings = useCallback(() => {
    setUnitSettings(DEFAULT_UNIT_SETTINGS);
  }, [setUnitSettings]);

  return {
    unitSettings,
    hydrated,
    updateUnitSettings,
    replaceUnitSettings,
    resetUnitSettings,
  };
}
