import type { Location } from '@costify/shared/domain/location';
import { countActiveLocations, ensureDefaultLocations } from '@costify/shared/domain/location';
import {
  changeSubscriptionLocationCount,
  ensureTenantSubscription,
  type TenantSubscription,
} from '@costify/shared/domain/subscription';

export function syncSubscriptionWithActiveLocations(
  subscription: TenantSubscription | undefined,
  locations: Location[] | undefined
): TenantSubscription {
  const activeCount = Math.max(1, countActiveLocations(ensureDefaultLocations(locations)));
  const current = ensureTenantSubscription(subscription);
  if (current.locationCount === activeCount) {
    return current;
  }
  return changeSubscriptionLocationCount(current, activeCount);
}
