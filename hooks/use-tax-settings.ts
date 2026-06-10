'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TaxSettings } from '@/lib/domain/types';
import { DEFAULT_TAX_SETTINGS, STORAGE_KEYS } from '@/lib/domain/constants';
import { loadFromStorage, saveToStorage } from '@/lib/storage/local-storage';

export function useTaxSettings() {
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTaxSettings(loadFromStorage(STORAGE_KEYS.taxSettings, DEFAULT_TAX_SETTINGS));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEYS.taxSettings, taxSettings);
  }, [taxSettings, hydrated]);

  const updateTaxSettings = useCallback((updates: Partial<TaxSettings>) => {
    setTaxSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  return { taxSettings, hydrated, updateTaxSettings };
}
