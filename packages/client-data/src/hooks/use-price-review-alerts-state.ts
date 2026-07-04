import { useCallback, useMemo } from 'react';
import { STORAGE_KEYS } from '@costify/shared/domain/constants';
import type { PriceReviewAlertTarget } from '@costify/shared/domain/exchange-rates';
import type { ProductCalculation, RawMaterial } from '@costify/shared/domain/types';
import type { AppTab } from '../navigation/tabs';
import { useStorage } from '../context/ClientDataProvider';
import { useAsyncPersistedResource } from './use-persisted-state';
import { usePriceReviewAlerts } from './use-exchange-rates-context';

export function getTabForPriceReviewTarget(target: PriceReviewAlertTarget): AppTab {
  return target.refType === 'raw_material' ? 'raw-materials' : 'products';
}

export function useActivePriceReviewAlerts(materials: RawMaterial[], products: ProductCalculation[]) {
  const storage = useStorage();
  const alerts = usePriceReviewAlerts(materials, products);

  const { value: dismissedIds, setValue: setDismissedIds } = useAsyncPersistedResource({
    load: () => storage.load<string[]>(STORAGE_KEYS.dismissedPriceAlerts, []),
    save: (ids) => storage.save(STORAGE_KEYS.dismissedPriceAlerts, ids),
    initialValue: [] as string[],
  });

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => !dismissedIds.includes(alert.id)),
    [alerts, dismissedIds]
  );

  const dismissAlert = useCallback(
    (alertId: string) => {
      setDismissedIds((prev) => (prev.includes(alertId) ? prev : [...prev, alertId]));
    },
    [setDismissedIds]
  );

  return { alerts: activeAlerts, dismissAlert };
}
