import {
  ensureTenantSubscription,
  isSubscriptionCurrentlyActive,
  type SubscriptionStatus,
  type TenantSubscription,
} from './subscription';

export type AccountLifecycleStatus = 'pending' | 'active' | 'suspended';

export type AccessLevel = 'trial' | 'readonly' | 'full';

export const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;
export const TRIAL_PRODUCT_LIMIT = 5;
export const TRIAL_RAW_MATERIAL_LIMIT = 10;

export interface TenantAccessContext {
  tenantStatus: AccountLifecycleStatus;
  userStatus: AccountLifecycleStatus;
  tenantCreatedAt: number;
  subscription?: TenantSubscription | null;
  now?: number;
}

export interface ResolvedTenantAccess {
  level: AccessLevel;
  trialEndsAt?: number;
  productLimit?: number;
  rawMaterialLimit?: number;
  subscriptionStatus: SubscriptionStatus;
  tenantPending: boolean;
}

export function shouldExpireTrialSubscription(
  tenantCreatedAt: number,
  subscription?: TenantSubscription | null,
  now = Date.now()
): boolean {
  const sub = ensureTenantSubscription(subscription);
  if (sub.status === 'expired') return false;
  if (isSubscriptionCurrentlyActive(sub, now)) return false;
  return now >= tenantCreatedAt + TRIAL_DURATION_MS;
}

export function resolveTenantAccess(input: TenantAccessContext): ResolvedTenantAccess {
  const now = input.now ?? Date.now();
  const subscription = ensureTenantSubscription(input.subscription);
  const trialEndsAt = input.tenantCreatedAt + TRIAL_DURATION_MS;
  const tenantPending = input.tenantStatus === 'pending';
  const trialActive = now < trialEndsAt;

  if (input.userStatus === 'suspended' || input.tenantStatus === 'suspended') {
    return {
      level: 'readonly',
      subscriptionStatus: subscription.status,
      tenantPending,
    };
  }

  const subscriptionActive = isSubscriptionActive(subscription, now);

  if (subscriptionActive) {
    return {
      level: 'full',
      subscriptionStatus: subscription.status,
      tenantPending,
    };
  }

  const subscriptionExpired =
    subscription.status === 'expired' ||
    (subscription.status === 'active' && Boolean(subscription.expiresAt && subscription.expiresAt <= now));

  if (subscriptionExpired) {
    return {
      level: 'readonly',
      subscriptionStatus: 'expired',
      tenantPending,
    };
  }

  if (trialActive) {
    return {
      level: 'trial',
      trialEndsAt,
      productLimit: TRIAL_PRODUCT_LIMIT,
      rawMaterialLimit: TRIAL_RAW_MATERIAL_LIMIT,
      subscriptionStatus: subscription.status,
      tenantPending,
    };
  }

  return {
    level: 'readonly',
    subscriptionStatus: subscription.status,
    tenantPending,
  };
}

export function canWriteWorkspaceData(level: AccessLevel): boolean {
  return level === 'trial' || level === 'full';
}

export function canSyncToCloud(level: AccessLevel): boolean {
  return level === 'trial' || level === 'full';
}

export function canAddProduct(level: AccessLevel, currentCount: number, limit = TRIAL_PRODUCT_LIMIT): boolean {
  if (level === 'full') return true;
  if (level === 'readonly') return false;
  return currentCount < limit;
}

export function canAddRawMaterial(
  level: AccessLevel,
  currentCount: number,
  limit = TRIAL_RAW_MATERIAL_LIMIT
): boolean {
  if (level === 'full') return true;
  if (level === 'readonly') return false;
  return currentCount < limit;
}

export function canManageWarehouses(level: AccessLevel): boolean {
  return level === 'full';
}

export function getAccessLevelLabel(level: AccessLevel): string {
  if (level === 'trial') return 'Periodo de prueba';
  if (level === 'readonly') return 'Solo lectura';
  return 'Acceso completo';
}

export function formatTrialRemaining(trialEndsAt: number, now = Date.now()): string {
  const remainingMs = Math.max(0, trialEndsAt - now);
  const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Prueba finalizada';
  if (days === 1) return '1 día restante';
  return `${days} días restantes`;
}

export function isSubscriptionActive(
  subscription?: TenantSubscription | null,
  now = Date.now()
): boolean {
  const sub = ensureTenantSubscription(subscription);
  return sub.status === 'active' && (!sub.expiresAt || sub.expiresAt > now);
}

export function shouldShowAccessBanner(
  user: { role?: string; accessLevel?: AccessLevel; subscriptionStatus?: SubscriptionStatus } | null | undefined
): boolean {
  if (!user || user.role === 'super_admin') return false;
  if (user.accessLevel === 'full') return false;
  if (user.subscriptionStatus === 'active') return false;
  return user.accessLevel === 'trial' || user.accessLevel === 'readonly';
}
