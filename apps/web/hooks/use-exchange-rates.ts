'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_EXCHANGE_RATE_SETTINGS,
  type ExchangeRateSettings,
  type ExchangeRateSnapshot,
  mapTrmiResponse,
} from '@costify/shared/domain/exchange-rates';
import { migrateExchangeRateSettings } from '@costify/shared/domain/migrate-exchange-rates';
import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { loadFromStorage, saveToStorage } from '@/lib/storage/local-storage';
import { useStorageReload } from '@/hooks/use-storage-reload';

const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

function loadSettings(): ExchangeRateSettings {
  const saved = loadFromStorage<unknown>(STORAGE_KEYS.exchangeRates, null);
  return saved ? migrateExchangeRateSettings(saved) : { ...DEFAULT_EXCHANGE_RATE_SETTINGS };
}

async function fetchRemoteSnapshot(): Promise<ExchangeRateSnapshot> {
  const response = await fetch('/api/exchange-rates', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? 'No se pudieron obtener las tasas.');
  }

  const json = (await response.json()) as {
    snapshot: ExchangeRateSnapshot;
    warning?: string;
  };

  return {
    ...json.snapshot,
    stale: json.snapshot.stale ?? Boolean(json.warning),
  };
}

export function useExchangeRates() {
  const [settings, setSettings] = useState<ExchangeRateSettings>(DEFAULT_EXCHANGE_RATE_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshInFlight = useRef(false);

  const reload = useCallback(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    reload();
    setHydrated(true);
  }, [reload]);

  useStorageReload(reload);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(STORAGE_KEYS.exchangeRates, settings);
  }, [settings, hydrated]);

  const refreshRates = useCallback(async (force = false) => {
    if (refreshInFlight.current) return settings.lastSnapshot;
    refreshInFlight.current = true;
    setRefreshing(true);
    setError(null);

    try {
      const last = settings.lastSnapshot;
      const isFresh =
        last && !last.stale && Date.now() - last.fetchedAt < REFRESH_INTERVAL_MS;

      if (!force && isFresh) {
        return last;
      }

      const snapshot = await fetchRemoteSnapshot();
      setSettings((prev) => ({ ...prev, lastSnapshot: snapshot }));
      return snapshot;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar tasas.';
      setError(message);

      if (settings.lastSnapshot) {
        return { ...settings.lastSnapshot, stale: true };
      }

      return null;
    } finally {
      setRefreshing(false);
      refreshInFlight.current = false;
    }
  }, [settings.lastSnapshot]);

  useEffect(() => {
    if (!hydrated) return;
    void refreshRates();
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hydrated) return;

    const interval = setInterval(() => {
      void refreshRates();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [hydrated, refreshRates]);

  const updateSettings = useCallback((updates: Partial<ExchangeRateSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const replaceSettings = useCallback((next: ExchangeRateSettings) => {
    setSettings(migrateExchangeRateSettings(next));
  }, []);

  const markCostingRate = useCallback((usdRate: number) => {
    setSettings((prev) => ({
      ...prev,
      lastCostingRateUsd: usdRate,
      lastCostingAt: Date.now(),
    }));
  }, []);

  const applyLocalSnapshot = useCallback((snapshot: ExchangeRateSnapshot) => {
    setSettings((prev) => ({ ...prev, lastSnapshot: snapshot }));
  }, []);

  return {
    exchangeSettings: settings,
    snapshot: settings.lastSnapshot,
    hydrated,
    refreshing,
    error,
    refreshRates,
    updateSettings,
    replaceSettings,
    markCostingRate,
    applyLocalSnapshot,
  };
}

/** Para tests o importación offline de snapshot crudo de la API */
export function parseTrmiApiResponse(data: unknown): ExchangeRateSnapshot {
  return mapTrmiResponse(data as Parameters<typeof mapTrmiResponse>[0]);
}
