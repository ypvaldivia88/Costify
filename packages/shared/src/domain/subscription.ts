export type SubscriptionPlan = 'monthly' | 'semiannual' | 'annual';

export type SubscriptionStatus = 'pending_payment' | 'active' | 'expired';

export const SUBSCRIPTION_MONTHLY_PRICE_USD = 10;

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
}

export function getSubscriptionPlanPriceUsd(plan: SubscriptionPlan): number {
  const months = SUBSCRIPTION_PLAN_MONTHS[plan];
  const discount = SUBSCRIPTION_PLAN_DISCOUNTS[plan];
  const subtotal = SUBSCRIPTION_MONTHLY_PRICE_USD * months;
  return Math.round(subtotal * (1 - discount) * 100) / 100;
}

export function getSubscriptionDiscountPercent(plan: SubscriptionPlan): number {
  return Math.round(SUBSCRIPTION_PLAN_DISCOUNTS[plan] * 100);
}

export function buildPendingSubscription(plan: SubscriptionPlan, requestedAt = Date.now()): TenantSubscription {
  return {
    plan,
    status: 'pending_payment',
    monthlyPriceUsd: SUBSCRIPTION_MONTHLY_PRICE_USD,
    discountPercent: getSubscriptionDiscountPercent(plan),
    priceUsd: getSubscriptionPlanPriceUsd(plan),
    requestedAt,
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

export function buildWhatsAppPaymentMessage(input: {
  businessName: string;
  contactName: string;
  email: string;
  plan: SubscriptionPlan;
  priceUsd: number;
  isRenewal?: boolean;
}): string {
  const action = input.isRenewal ? 'renovar' : 'activar';
  const planLabel = SUBSCRIPTION_PLAN_LABELS[input.plan];
  return [
    `Hola, quiero ${action} mi cuenta en Costify.`,
    `Negocio: ${input.businessName}`,
    `Contacto: ${input.contactName}`,
    `Correo: ${input.email}`,
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
    priceUsd: getSubscriptionPlanPriceUsd(plan),
    discountPercent: getSubscriptionDiscountPercent(plan),
    monthlyPriceUsd: SUBSCRIPTION_MONTHLY_PRICE_USD,
    status: options?.keepStatus ? subscription.status : 'pending_payment',
    requestedAt: Date.now(),
  };
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

export function ensureTenantSubscription(subscription?: TenantSubscription | null): TenantSubscription {
  if (!subscription) {
    return buildPendingSubscription('monthly');
  }
  if (
    subscription.status === 'active' &&
    subscription.expiresAt &&
    subscription.expiresAt < Date.now()
  ) {
    return { ...subscription, status: 'expired' };
  }
  return subscription;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = ['monthly', 'semiannual', 'annual'];

export type SubscriptionAdminAction = 'activate' | 'renew' | 'expire' | 'pending' | 'set_plan';

export function applySubscriptionAdminAction(
  subscription: TenantSubscription,
  action: SubscriptionAdminAction,
  plan?: SubscriptionPlan
): TenantSubscription {
  switch (action) {
    case 'activate':
      return activateSubscription(plan ? changeSubscriptionPlan(subscription, plan, { keepStatus: true }) : subscription);
    case 'renew':
      return renewSubscription(plan ? changeSubscriptionPlan(subscription, plan, { keepStatus: true }) : subscription);
    case 'expire':
      return markSubscriptionExpired(subscription);
    case 'pending':
      return markSubscriptionPendingPayment(subscription);
    case 'set_plan':
      if (!plan) throw new Error('Plan requerido.');
      return changeSubscriptionPlan(subscription, plan);
    default:
      return subscription;
  }
}

export function buildWhatsAppPaymentUrl(message: string): string {
  return `${WHATSAPP_SUPPORT_URL}?text=${encodeURIComponent(message)}`;
}
