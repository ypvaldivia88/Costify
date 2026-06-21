'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TaxSettings } from '@/lib/domain/types';
import { DEFAULT_TAX_SETTINGS, STORAGE_KEYS } from '@/lib/domain/constants';
import { migrateTaxSettings } from '@/lib/domain/migrate-tax-settings';
import { loadFromStorage, saveToStorage } from '@/lib/storage/local-storage';
import { useStorageReload } from '@/hooks/use-storage-reload';

const LEGACY_TAX_STORAGE_KEY = 'costify_tax_settings_v2';

function loadTaxSettings(): TaxSettings {
  const current = loadFromStorage<unknown>(STORAGE_KEYS.taxSettings, null);
  if (current) {
    return migrateTaxSettings(current);
  }

  const legacy = loadFromStorage<unknown>(LEGACY_TAX_STORAGE_KEY, null);
  if (legacy) {
    const migrated = migrateTaxSettings(legacy);
    saveToStorage(STORAGE_KEYS.taxSettings, migrated);
    return migrated;
  }

  return DEFAULT_TAX_SETTINGS;
}

export function useTaxSettings() {
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    setTaxSettings(loadTaxSettings());
  }, []);

  useEffect(() => {
    reload();
    setHydrated(true);
  }, [reload]);

  useStorageReload(reload);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEYS.taxSettings, taxSettings);
  }, [taxSettings, hydrated]);

  const updateTaxSettings = useCallback((updates: Partial<TaxSettings>) => {
    setTaxSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const replaceTaxSettings = useCallback((settings: TaxSettings) => {
    setTaxSettings(migrateTaxSettings(settings));
  }, []);

  return { taxSettings, hydrated, updateTaxSettings, replaceTaxSettings };
}
