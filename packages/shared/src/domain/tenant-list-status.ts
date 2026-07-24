import type { AccountLifecycleStatus } from './access';
import {
  ensureTenantSubscription,
  getSubscriptionStatusLabel,
  isSubscriptionCurrentlyActive,
  type TenantSubscription,
} from './subscription';
import { resolveTenantAccess, TRIAL_DURATION_MS } from './access';

export interface TenantListStatus {
  label: string;
  detail?: string;
}

/** Primary status label for admin tenant lists (web + mobile). */
export function getTenantListStatus(input: {
  status: AccountLifecycleStatus;
  createdAt: number;
  subscription?: TenantSubscription | null;
}): TenantListStatus {
  const subscription = ensureTenantSubscription(input.subscription);

  if (input.status === 'pending') {
    return { label: 'Registro pendiente' };
  }
  if (input.status === 'suspended') {
    return { label: 'Suspendido' };
  }

  const access = resolveTenantAccess({
    tenantStatus: input.status,
    userStatus: 'active',
    tenantCreatedAt: input.createdAt,
    subscription,
  });

  if (access.level === 'trial') {
    const daysLeft = Math.ceil(
      Math.max(0, input.createdAt + TRIAL_DURATION_MS - Date.now()) / (24 * 60 * 60 * 1000)
    );
    return {
      label: 'Prueba gratuita',
      detail: daysLeft > 0 ? `${daysLeft} día${daysLeft === 1 ? '' : 's'} restantes` : undefined,
    };
  }

  if (subscription.status === 'pending_payment' && !isSubscriptionCurrentlyActive(subscription)) {
    return { label: 'Pendiente de pago' };
  }

  if (
    subscription.status === 'expired' ||
    (subscription.status === 'active' &&
      subscription.expiresAt &&
      subscription.expiresAt <= Date.now())
  ) {
    return { label: 'Vencida' };
  }

  if (isSubscriptionCurrentlyActive(subscription)) {
    return { label: 'Activa', detail: getSubscriptionStatusLabel(subscription) };
  }

  return { label: getSubscriptionStatusLabel(subscription) };
}
