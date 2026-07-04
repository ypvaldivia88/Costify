import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_EXCHANGE_RATE_SETTINGS,
  type ExchangeRateSettings,
  type ExchangeRateSnapshot,
  mapTrmiResponse,
} from '@costify/shared/domain/exchange-rates';
import { migrateExchangeRateSettings } from '@costify/shared/domain/migrate-exchange-rates';
import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import { useClientData, useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';

const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

export function useExchangeRates() {
  const storage = useStorage();
  const { fetchExchangeSnapshot } = useClientData();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshInFlight = useRef(false);

  const load = useCallback(async () => {
    const saved = await storage.load<unknown>(STORAGE_KEYS.exchangeRates, null);
    return saved ? migrateExchangeRateSettings(saved) : { ...DEFAULT_EXCHANGE_RATE_SETTINGS };
  }, [storage]);

  const save = useCallback(
    (settings: ExchangeRateSettings) => storage.save(STORAGE_KEYS.exchangeRates, settings),
    [storage]
  );

  const { value: settings, setValue: setSettings, hydrated } = useAsyncPersistedResource({
    load,
    save,
    initialValue: DEFAULT_EXCHANGE_RATE_SETTINGS,
  });

  const refreshRates = useCallback(
    async (force = false) => {
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

        const snapshot = await fetchExchangeSnapshot();
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
    },
    [fetchExchangeSnapshot, settings.lastSnapshot, setSettings]
  );

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

  const updateSettings = useCallback(
    (updates: Partial<ExchangeRateSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
    },
    [setSettings]
  );

  const replaceSettings = useCallback(
    (next: ExchangeRateSettings) => {
      setSettings(migrateExchangeRateSettings(next));
    },
    [setSettings]
  );

  const markCostingRate = useCallback(
    (usdRate: number) => {
      setSettings((prev) => ({
        ...prev,
        lastCostingRateUsd: usdRate,
        lastCostingAt: Date.now(),
      }));
    },
    [setSettings]
  );

  const applyLocalSnapshot = useCallback(
    (snapshot: ExchangeRateSnapshot) => {
      setSettings((prev) => ({ ...prev, lastSnapshot: snapshot }));
    },
    [setSettings]
  );

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

export function parseTrmiApiResponse(data: unknown): ExchangeRateSnapshot {
  return mapTrmiResponse(data as Parameters<typeof mapTrmiResponse>[0]);
}
