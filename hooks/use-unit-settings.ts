'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UnitSettings } from '@/lib/domain/types';
import { STORAGE_KEYS } from '@/lib/domain/constants';
import { DEFAULT_UNIT_SETTINGS, migrateUnitSettings } from '@/lib/domain/unit-settings';
import { loadFromStorage, saveToStorage } from '@/lib/storage/local-storage';
import { useStorageReload } from '@/hooks/use-storage-reload';

function loadUnitSettings(): UnitSettings {
  const saved = loadFromStorage<unknown>(STORAGE_KEYS.unitSettings, null);
  return saved ? migrateUnitSettings(saved) : DEFAULT_UNIT_SETTINGS;
}

export function useUnitSettings() {
  const [unitSettings, setUnitSettings] = useState<UnitSettings>(DEFAULT_UNIT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    setUnitSettings(loadUnitSettings());
  }, []);

  useEffect(() => {
    reload();
    setHydrated(true);
  }, [reload]);

  useStorageReload(reload);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEYS.unitSettings, unitSettings);
  }, [unitSettings, hydrated]);

  const updateUnitSettings = useCallback((settings: UnitSettings) => {
    setUnitSettings(migrateUnitSettings(settings));
  }, []);

  const replaceUnitSettings = useCallback((settings: UnitSettings) => {
    setUnitSettings(migrateUnitSettings(settings));
  }, []);

  const resetUnitSettings = useCallback(() => {
    setUnitSettings(DEFAULT_UNIT_SETTINGS);
  }, []);

  return {
    unitSettings,
    hydrated,
    updateUnitSettings,
    replaceUnitSettings,
    resetUnitSettings,
  };
}
