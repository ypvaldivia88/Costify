import type { AccountStatus } from '@/lib/auth/types';
import { getTenantListStatus } from '@costify/shared/domain/tenant-list-status';

export function formatAdminDate(timestamp: number): string {
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

export function formatAdminDateShort(timestamp: number): string {
  return new Intl.DateTimeFormat('es', { dateStyle: 'short' }).format(new Date(timestamp));
}

export function tenantStatusLabel(
  status: AccountStatus,
  options?: {
    createdAt?: number;
    subscription?: import('@costify/shared/domain/subscription').TenantSubscription | null;
  }
): string {
  if (options?.createdAt != null) {
    return getTenantListStatus({
      status,
      createdAt: options.createdAt,
      subscription: options.subscription,
    }).label;
  }
  if (status === 'pending') return 'Pendiente';
  if (status === 'suspended') return 'Suspendido';
  return 'Activo';
}

export function tenantStatusTone(status: AccountStatus): string {
  if (status === 'pending') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
  }
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
  }
  return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
}

export function subscriptionStatusTone(status: string): string {
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
  }
  if (status === 'pending_payment') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
  }
  return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300';
}
