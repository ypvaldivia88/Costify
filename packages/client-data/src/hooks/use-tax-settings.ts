import { useCallback } from 'react';
import type { TaxSettings } from '@costify/shared/domain/types';
import { DEFAULT_TAX_SETTINGS, STORAGE_KEYS } from '@costify/shared/domain/constants';
import { migrateTaxSettings } from '@costify/shared/domain/migrate-tax-settings';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

const LEGACY_TAX_STORAGE_KEY = 'costify_tax_settings_v2';

export function useTaxSettings() {
  const storage = useStorage();

  const load = useCallback(async () => {
    const current = await storage.load<unknown>(STORAGE_KEYS.taxSettings, null);
    if (current) {
      return migrateTaxSettings(current);
    }

    const legacy = await storage.load<unknown>(LEGACY_TAX_STORAGE_KEY, null);
    if (legacy) {
      const migrated = migrateTaxSettings(legacy);
      await storage.save(STORAGE_KEYS.taxSettings, migrated);
      return migrated;
    }

    return DEFAULT_TAX_SETTINGS;
  }, [storage]);

  const save = useCallback(
    (taxSettings: TaxSettings) => storage.save(STORAGE_KEYS.taxSettings, taxSettings),
    [storage]
  );

  const { value: taxSettings, setValue: setTaxSettings, hydrated } = useAsyncPersistedResource({
    load,
    save,
    initialValue: DEFAULT_TAX_SETTINGS,
  });

  const updateTaxSettings = useCallback(
    (updates: Partial<TaxSettings>) => {
      setTaxSettings((prev) => ({ ...prev, ...updates }));
    },
    [setTaxSettings]
  );

  const replaceTaxSettings = useCallback(
    (settings: TaxSettings) => {
      setTaxSettings(migrateTaxSettings(settings));
    },
    [setTaxSettings]
  );

  return { taxSettings, hydrated, updateTaxSettings, replaceTaxSettings };
}
