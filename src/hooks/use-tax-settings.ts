import { useCallback, useEffect, useState } from 'react';
import type { TaxSettings } from '@/domain/types';
import { migrateTaxSettings } from '@/domain/migrate-tax-settings';
import { DEFAULT_TAX_SETTINGS, STORAGE_KEYS } from '@/domain/constants';
import { loadFromStorage, saveToStorage } from '@/storage/async-storage';

const LEGACY_TAX_STORAGE_KEY = 'costify_tax_settings_v2';

export function useTaxSettings() {
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const current = await loadFromStorage<unknown>(STORAGE_KEYS.taxSettings, null);
      if (current) {
        if (mounted) {
          setTaxSettings(migrateTaxSettings(current));
          setHydrated(true);
        }
        return;
      }

      const legacy = await loadFromStorage<unknown>(LEGACY_TAX_STORAGE_KEY, null);
      const migrated = migrateTaxSettings(legacy ?? DEFAULT_TAX_SETTINGS);
      await saveToStorage(STORAGE_KEYS.taxSettings, migrated);
      if (mounted) {
        setTaxSettings(migrated);
        setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void saveToStorage(STORAGE_KEYS.taxSettings, taxSettings);
  }, [taxSettings, hydrated]);

  const updateTaxSettings = useCallback((updates: Partial<TaxSettings>) => {
    setTaxSettings((prev) => migrateTaxSettings({ ...prev, ...updates }));
  }, []);

  const replaceTaxSettings = useCallback((settings: TaxSettings) => {
    setTaxSettings(migrateTaxSettings(settings));
  }, []);

  return { taxSettings, hydrated, updateTaxSettings, replaceTaxSettings };
}
