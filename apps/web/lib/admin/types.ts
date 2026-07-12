import type { PublicTenant } from '@/lib/auth/types';

export interface AdminWorkspaceSummary {
  productCount: number;
  rawMaterialCount: number;
  warehouseCount: number;
  stockMovementCount: number;
  updatedAt: number;
}

export interface AdminTenantRow extends PublicTenant {
  adminEmail: string | null;
  adminName: string | null;
  userCount: number;
  workspace: AdminWorkspaceSummary | null;
}

export interface AdminChartSlice {
  label: string;
  count: number;
}

export interface AdminOverviewStats {
  totalTenants: number;
  pendingTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  activeSubscriptions: number;
  pendingPayments: number;
  expiredSubscriptions: number;
  estimatedMrrUsd: number;
}

export interface AdminOverview {
  stats: AdminOverviewStats;
  charts: {
    tenantsByStatus: AdminChartSlice[];
    tenantsByPlan: AdminChartSlice[];
    registrationsByMonth: AdminChartSlice[];
  };
  tenants: AdminTenantRow[];
}
