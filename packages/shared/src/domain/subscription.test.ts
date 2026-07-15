import { describe, expect, it } from 'vitest';
import {
  buildPendingSubscription,
  changeSubscriptionLocationCount,
  ensureTenantSubscription,
  getSubscriptionMonthlySubtotalUsd,
  getSubscriptionPlanPriceUsd,
  normalizeLocationCount,
  SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD,
  SUBSCRIPTION_MONTHLY_PRICE_USD,
} from './subscription';

describe('subscription multi-location pricing', () => {
  it('normalizes location count to at least 1', () => {
    expect(normalizeLocationCount(0)).toBe(1);
    expect(normalizeLocationCount(-2)).toBe(1);
    expect(normalizeLocationCount(undefined)).toBe(1);
  });

  it('charges base price for a single location', () => {
    expect(getSubscriptionMonthlySubtotalUsd(1)).toBe(SUBSCRIPTION_MONTHLY_PRICE_USD);
    expect(getSubscriptionPlanPriceUsd('monthly', 1)).toBe(SUBSCRIPTION_MONTHLY_PRICE_USD);
  });

  it('adds per-location fee for additional active locations', () => {
    expect(getSubscriptionMonthlySubtotalUsd(3)).toBe(
      SUBSCRIPTION_MONTHLY_PRICE_USD + 2 * SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD
    );
    expect(getSubscriptionPlanPriceUsd('monthly', 3)).toBe(31);
  });

  it('applies plan discounts on the full monthly subtotal', () => {
    expect(getSubscriptionPlanPriceUsd('semiannual', 3)).toBe(167.4);
    expect(getSubscriptionPlanPriceUsd('annual', 3)).toBe(316.2);
  });

  it('builds pending subscription with location count', () => {
    const sub = buildPendingSubscription('monthly', Date.now(), 3);
    expect(sub.locationCount).toBe(3);
    expect(sub.monthlyPriceUsd).toBe(31);
    expect(sub.priceUsd).toBe(31);
    expect(sub.includedLocations).toBe(1);
    expect(sub.additionalLocationPriceUsd).toBe(SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD);
  });

  it('recalculates price when location count changes', () => {
    const sub = buildPendingSubscription('monthly', Date.now(), 1);
    const updated = changeSubscriptionLocationCount(sub, 3);
    expect(updated.locationCount).toBe(3);
    expect(updated.priceUsd).toBe(31);
    expect(updated.status).toBe('pending_payment');
  });

  it('migrates legacy subscriptions without location fields', () => {
    const legacy = {
      plan: 'monthly' as const,
      status: 'active' as const,
      priceUsd: 15,
      monthlyPriceUsd: 15,
      discountPercent: 0,
      requestedAt: 1,
    };
    const migrated = ensureTenantSubscription(legacy);
    expect(migrated.locationCount).toBe(1);
    expect(migrated.includedLocations).toBe(1);
  });
});
