import { getDb } from '@/lib/db/mongodb';
import {
  TENANTS_COLLECTION,
  USERS_COLLECTION,
  type TenantDocument,
  type UserDocument,
} from '@/lib/auth/types';
import { WORKSPACES_COLLECTION, type WorkspaceDocument } from '@/lib/db/workspace';
import {
  ensureTenantSubscription,
  SUBSCRIPTION_MONTHLY_PRICE_USD,
  SUBSCRIPTION_PLAN_LABELS,
  type SubscriptionPlan,
} from '@costify/shared/domain/subscription';
import type { AdminOverview, AdminTenantRow, AdminChartSlice } from '@/lib/admin/types';

const STATUS_LABELS: Record<TenantDocument['status'], string> = {
  pending: 'Pendiente',
  active: 'Activo',
  suspended: 'Suspendido',
};

function monthKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatMonthLabel(monthKeyValue: string): string {
  const [year, month] = monthKeyValue.split('-').map(Number);
  return new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit' }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );
}

function buildRegistrationsByMonth(tenants: TenantDocument[]): AdminChartSlice[] {
  const counts = new Map<string, number>();
  for (const tenant of tenants) {
    const key = monthKey(tenant.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const sortedKeys = [...counts.keys()].sort();
  const recentKeys = sortedKeys.slice(-6);

  return recentKeys.map((key) => ({
    label: formatMonthLabel(key),
    count: counts.get(key) ?? 0,
  }));
}

function buildTenantsByStatus(tenants: TenantDocument[]): AdminChartSlice[] {
  const counts: Record<TenantDocument['status'], number> = {
    pending: 0,
    active: 0,
    suspended: 0,
  };

  for (const tenant of tenants) {
    counts[tenant.status] += 1;
  }

  return (Object.keys(counts) as TenantDocument['status'][]).map((status) => ({
    label: STATUS_LABELS[status],
    count: counts[status],
  }));
}

function buildTenantsByPlan(tenants: TenantDocument[]): AdminChartSlice[] {
  const counts = new Map<SubscriptionPlan, number>();
  for (const plan of Object.keys(SUBSCRIPTION_PLAN_LABELS) as SubscriptionPlan[]) {
    counts.set(plan, 0);
  }

  for (const tenant of tenants) {
    const subscription = ensureTenantSubscription(tenant.subscription);
    counts.set(subscription.plan, (counts.get(subscription.plan) ?? 0) + 1);
  }

  return (Object.keys(SUBSCRIPTION_PLAN_LABELS) as SubscriptionPlan[]).map((plan) => ({
    label: SUBSCRIPTION_PLAN_LABELS[plan],
    count: counts.get(plan) ?? 0,
  }));
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const db = await getDb();

  const [tenants, users, workspaces] = await Promise.all([
    db.collection<TenantDocument>(TENANTS_COLLECTION).find({}).sort({ createdAt: -1 }).toArray(),
    db
      .collection<UserDocument>(USERS_COLLECTION)
      .find({ role: { $ne: 'super_admin' } })
      .toArray(),
    db.collection<WorkspaceDocument>(WORKSPACES_COLLECTION).find({}).toArray(),
  ]);

  const workspaceByTenantId = new Map(workspaces.map((workspace) => [workspace.tenantId, workspace]));
  const usersByTenantId = new Map<string, UserDocument[]>();

  for (const user of users) {
    if (!user.tenantId) continue;
    const bucket = usersByTenantId.get(user.tenantId) ?? [];
    bucket.push(user);
    usersByTenantId.set(user.tenantId, bucket);
  }

  let activeSubscriptions = 0;
  let pendingPayments = 0;
  let expiredSubscriptions = 0;
  let estimatedMrrUsd = 0;

  const tenantRows: AdminTenantRow[] = tenants.map((tenant) => {
    const tenantUsers = usersByTenantId.get(tenant.tenantId) ?? [];
    const adminUser =
      tenantUsers.find((user) => user.role === 'tenant_admin') ?? tenantUsers[0] ?? null;
    const workspace = workspaceByTenantId.get(tenant.tenantId) ?? null;
    const subscription = ensureTenantSubscription(tenant.subscription);

    if (subscription.status === 'active') {
      activeSubscriptions += 1;
      estimatedMrrUsd += subscription.monthlyPriceUsd || SUBSCRIPTION_MONTHLY_PRICE_USD;
    } else if (subscription.status === 'pending_payment') {
      pendingPayments += 1;
    } else if (subscription.status === 'expired') {
      expiredSubscriptions += 1;
    }

    return {
      tenantId: tenant.tenantId,
      name: tenant.name,
      contactEmail: tenant.contactEmail,
      workspaceId: tenant.workspaceId,
      status: tenant.status,
      createdAt: tenant.createdAt,
      subscription,
      adminEmail: adminUser?.email ?? null,
      adminName: adminUser?.name ?? null,
      userCount: tenantUsers.length,
      workspace: workspace
        ? {
            productCount: workspace.inventory.length,
            rawMaterialCount: workspace.rawMaterials.length,
            warehouseCount: workspace.warehouses.length,
            stockMovementCount: workspace.stockMovements.length,
            updatedAt: workspace.updatedAt,
          }
        : null,
    };
  });

  return {
    stats: {
      totalTenants: tenants.length,
      pendingTenants: tenants.filter((tenant) => tenant.status === 'pending').length,
      activeTenants: tenants.filter((tenant) => tenant.status === 'active').length,
      suspendedTenants: tenants.filter((tenant) => tenant.status === 'suspended').length,
      totalUsers: users.length,
      activeSubscriptions,
      pendingPayments,
      expiredSubscriptions,
      estimatedMrrUsd: Math.round(estimatedMrrUsd * 100) / 100,
    },
    charts: {
      tenantsByStatus: buildTenantsByStatus(tenants),
      tenantsByPlan: buildTenantsByPlan(tenants),
      registrationsByMonth: buildRegistrationsByMonth(tenants),
    },
    tenants: tenantRows,
  };
}
