export type SubscriptionPlan = 'monthly' | 'semiannual' | 'annual';

export type SubscriptionStatus = 'pending_payment' | 'active' | 'expired';

export const SUBSCRIPTION_MONTHLY_PRICE_USD = 15;

/** Locales incluidos en el precio base sin cargo adicional. */
export const SUBSCRIPTION_INCLUDED_LOCATIONS = 1;

/** Cargo mensual por cada local activo adicional. */
export const SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD = 8;

export const SUBSCRIPTION_MAX_LOCATION_COUNT = 20;

export const SUBSCRIPTION_PLAN_DISCOUNTS: Record<SubscriptionPlan, number> = {
  monthly: 0,
  semiannual: 0.1,
  annual: 0.15,
};

export const SUBSCRIPTION_PLAN_MONTHS: Record<SubscriptionPlan, number> = {
  monthly: 1,
  semiannual: 6,
  annual: 12,
};

export const SUBSCRIPTION_PLAN_LABELS: Record<SubscriptionPlan, string> = {
  monthly: 'Mensual',
  semiannual: '6 meses',
  annual: 'Anual',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  pending_payment: 'Pendiente de pago',
  active: 'Activa',
  expired: 'Vencida',
};

export const WHATSAPP_SUPPORT_NUMBER = '+5354148857';
export const WHATSAPP_SUPPORT_URL = `https://wa.me/5354148857`;

export interface TenantSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  priceUsd: number;
  monthlyPriceUsd: number;
  discountPercent: number;
  requestedAt: number;
  activatedAt?: number;
  expiresAt?: number;
  /** Plan solicitado por el cliente; no aplica hasta confirmación del super admin. */
  requestedPlan?: SubscriptionPlan;
  /** Locales activos facturados (mínimo 1). */
  locationCount: number;
  includedLocations: number;
  additionalLocationPriceUsd: number;
}

export function normalizeLocationCount(locationCount?: number): number {
  if (locationCount == null || !Number.isFinite(locationCount)) {
    return SUBSCRIPTION_INCLUDED_LOCATIONS;
  }
  return Math.min(
    SUBSCRIPTION_MAX_LOCATION_COUNT,
    Math.max(SUBSCRIPTION_INCLUDED_LOCATIONS, Math.floor(locationCount))
  );
}

export function getAdditionalLocationCount(locationCount: number): number {
  const normalized = normalizeLocationCount(locationCount);
  return Math.max(0, normalized - SUBSCRIPTION_INCLUDED_LOCATIONS);
}

export function getSubscriptionMonthlySubtotalUsd(locationCount = SUBSCRIPTION_INCLUDED_LOCATIONS): number {
  const normalized = normalizeLocationCount(locationCount);
  const additional = getAdditionalLocationCount(normalized);
  return SUBSCRIPTION_MONTHLY_PRICE_USD + additional * SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD;
}

export function getSubscriptionPlanPriceUsd(
  plan: SubscriptionPlan,
  locationCount = SUBSCRIPTION_INCLUDED_LOCATIONS
): number {
  const months = SUBSCRIPTION_PLAN_MONTHS[plan];
  const discount = SUBSCRIPTION_PLAN_DISCOUNTS[plan];
  const subtotal = getSubscriptionMonthlySubtotalUsd(locationCount) * months;
  return Math.round(subtotal * (1 - discount) * 100) / 100;
}

export function getSubscriptionDiscountPercent(plan: SubscriptionPlan): number {
  return Math.round(SUBSCRIPTION_PLAN_DISCOUNTS[plan] * 100);
}

function subscriptionPricingFields(
  plan: SubscriptionPlan,
  locationCount: number
): Pick<
  TenantSubscription,
  'monthlyPriceUsd' | 'discountPercent' | 'priceUsd' | 'locationCount' | 'includedLocations' | 'additionalLocationPriceUsd'
> {
  const normalized = normalizeLocationCount(locationCount);
  return {
    monthlyPriceUsd: getSubscriptionMonthlySubtotalUsd(normalized),
    discountPercent: getSubscriptionDiscountPercent(plan),
    priceUsd: getSubscriptionPlanPriceUsd(plan, normalized),
    locationCount: normalized,
    includedLocations: SUBSCRIPTION_INCLUDED_LOCATIONS,
    additionalLocationPriceUsd: SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD,
  };
}

export function buildPendingSubscription(
  plan: SubscriptionPlan,
  requestedAt = Date.now(),
  locationCount = SUBSCRIPTION_INCLUDED_LOCATIONS
): TenantSubscription {
  return {
    plan,
    status: 'pending_payment',
    requestedAt,
    ...subscriptionPricingFields(plan, locationCount),
  };
}

export function activateSubscription(
  subscription: TenantSubscription,
  activatedAt = Date.now()
): TenantSubscription {
  const months = SUBSCRIPTION_PLAN_MONTHS[subscription.plan];
  const expiresAt = new Date(activatedAt);
  expiresAt.setMonth(expiresAt.getMonth() + months);

  return {
    ...subscription,
    status: 'active',
    activatedAt,
    expiresAt: expiresAt.getTime(),
  };
}

export function getSubscriptionStatusLabel(subscription: TenantSubscription): string {
  if (subscription.status === 'active' && subscription.expiresAt && subscription.expiresAt < Date.now()) {
    return SUBSCRIPTION_STATUS_LABELS.expired;
  }
  return SUBSCRIPTION_STATUS_LABELS[subscription.status];
}

export function formatSubscriptionExpiry(expiresAt?: number): string {
  if (!expiresAt) return 'Sin fecha de vencimiento';
  return new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(new Date(expiresAt));
}

export function formatSubscriptionLocationBreakdown(locationCount: number): string {
  const normalized = normalizeLocationCount(locationCount);
  const additional = getAdditionalLocationCount(normalized);
  if (additional === 0) {
    return `${normalized} local incluido en precio base`;
  }
  return `${normalized} locales (${SUBSCRIPTION_INCLUDED_LOCATIONS} base + ${additional} adicional${additional === 1 ? '' : 'es'} × $${SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD}/mes)`;
}

export function buildWhatsAppPaymentMessage(input: {
  businessName: string;
  contactName: string;
  email: string;
  plan: SubscriptionPlan;
  priceUsd: number;
  locationCount?: number;
  isRenewal?: boolean;
}): string {
  const action = input.isRenewal ? 'renovar' : 'activar';
  const planLabel = SUBSCRIPTION_PLAN_LABELS[input.plan];
  const locationLine = formatSubscriptionLocationBreakdown(
    input.locationCount ?? SUBSCRIPTION_INCLUDED_LOCATIONS
  );
  return [
    `Hola, quiero ${action} mi cuenta en Costify.`,
    `Negocio: ${input.businessName}`,
    `Contacto: ${input.contactName}`,
    `Correo: ${input.email}`,
    `Locales: ${locationLine}`,
    `Plan: ${planLabel} (${input.priceUsd} USD)`,
  ].join('\n');
}

export function markSubscriptionPendingPayment(subscription: TenantSubscription): TenantSubscription {
  return { ...subscription, status: 'pending_payment', requestedAt: Date.now() };
}

export function markSubscriptionExpired(subscription: TenantSubscription): TenantSubscription {
  return { ...subscription, status: 'expired' };
}

export function changeSubscriptionPlan(
  subscription: TenantSubscription,
  plan: SubscriptionPlan,
  options?: { keepStatus?: boolean }
): TenantSubscription {
  return {
    ...subscription,
    plan,
    ...subscriptionPricingFields(plan, subscription.locationCount),
    status: options?.keepStatus ? subscription.status : 'pending_payment',
    requestedAt: Date.now(),
    requestedPlan: undefined,
  };
}

export function changeSubscriptionLocationCount(
  subscription: TenantSubscription,
  locationCount: number,
  options?: { keepStatus?: boolean }
): TenantSubscription {
  const normalized = normalizeLocationCount(locationCount);
  if (normalized === subscription.locationCount) {
    return subscription;
  }
  return {
    ...subscription,
    ...subscriptionPricingFields(subscription.plan, normalized),
    status: options?.keepStatus ? subscription.status : 'pending_payment',
    requestedAt: Date.now(),
  };
}

export function isSubscriptionCurrentlyActive(
  subscription: TenantSubscription,
  now = Date.now()
): boolean {
  return (
    subscription.status === 'active' && (!subscription.expiresAt || subscription.expiresAt > now)
  );
}

/** Solicitud de cambio de plan por el cliente: mantiene acceso si la suscripción sigue activa. */
export function requestClientPlanChange(
  subscription: TenantSubscription,
  plan: SubscriptionPlan,
  now = Date.now()
): TenantSubscription {
  const sub = ensureTenantSubscription(subscription);

  if (isSubscriptionCurrentlyActive(sub, now)) {
    if (plan === sub.plan) {
      return { ...sub, requestedPlan: undefined, requestedAt: Date.now() };
    }
    return {
      ...sub,
      requestedPlan: plan,
      requestedAt: Date.now(),
    };
  }

  return changeSubscriptionPlan(sub, plan);
}

function clearRequestedPlan(subscription: TenantSubscription): TenantSubscription {
  const { requestedPlan: _requestedPlan, ...rest } = subscription;
  return rest;
}

export function renewSubscription(
  subscription: TenantSubscription,
  referenceAt = Date.now()
): TenantSubscription {
  const base =
    subscription.status === 'active' &&
    subscription.expiresAt &&
    subscription.expiresAt > referenceAt
      ? subscription.expiresAt
      : referenceAt;
  const months = SUBSCRIPTION_PLAN_MONTHS[subscription.plan];
  const expiresAt = new Date(base);
  expiresAt.setMonth(expiresAt.getMonth() + months);

  return {
    ...subscription,
    status: 'active',
    activatedAt: subscription.activatedAt ?? referenceAt,
    expiresAt: expiresAt.getTime(),
  };
}

function migrateLegacySubscription(subscription: TenantSubscription): TenantSubscription {
  const locationCount = normalizeLocationCount(subscription.locationCount);
  const includedLocations = subscription.includedLocations ?? SUBSCRIPTION_INCLUDED_LOCATIONS;
  const additionalLocationPriceUsd =
    subscription.additionalLocationPriceUsd ?? SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD;
  const monthlyPriceUsd =
    subscription.monthlyPriceUsd ?? getSubscriptionMonthlySubtotalUsd(locationCount);
  const priceUsd =
    subscription.priceUsd ?? getSubscriptionPlanPriceUsd(subscription.plan, locationCount);

  return {
    ...subscription,
    locationCount,
    includedLocations,
    additionalLocationPriceUsd,
    monthlyPriceUsd,
    priceUsd,
  };
}

export function ensureTenantSubscription(subscription?: TenantSubscription | null): TenantSubscription {
  if (!subscription) {
    return buildPendingSubscription('monthly');
  }
  const migrated = migrateLegacySubscription(subscription);
  if (
    migrated.status === 'active' &&
    migrated.expiresAt &&
    migrated.expiresAt < Date.now()
  ) {
    return { ...migrated, status: 'expired' };
  }
  return migrated;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = ['monthly', 'semiannual', 'annual'];

export type SubscriptionAdminAction = 'activate' | 'renew' | 'expire' | 'pending' | 'set_plan';

export function applySubscriptionAdminAction(
  subscription: TenantSubscription,
  action: SubscriptionAdminAction,
  plan?: SubscriptionPlan,
  locationCount?: number
): TenantSubscription {
  let current = ensureTenantSubscription(subscription);
  if (locationCount != null) {
    current = changeSubscriptionLocationCount(current, locationCount, { keepStatus: true });
  }

  switch (action) {
    case 'activate':
      return clearRequestedPlan(
        activateSubscription(
          plan ? changeSubscriptionPlan(current, plan, { keepStatus: true }) : current
        )
      );
    case 'renew':
      return clearRequestedPlan(
        renewSubscription(
          plan ? changeSubscriptionPlan(current, plan, { keepStatus: true }) : current
        )
      );
    case 'expire':
      return clearRequestedPlan(markSubscriptionExpired(current));
    case 'pending':
      return clearRequestedPlan(markSubscriptionPendingPayment(current));
    case 'set_plan':
      if (!plan) throw new Error('Plan requerido.');
      return clearRequestedPlan(changeSubscriptionPlan(current, plan));
    default:
      return current;
  }
}

export function buildWhatsAppPaymentUrl(message: string): string {
  return `${WHATSAPP_SUPPORT_URL}?text=${encodeURIComponent(message)}`;
}
