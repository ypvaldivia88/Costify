export type UserRole = 'super_admin' | 'tenant_admin' | 'tenant_user';
export type AccountStatus = 'pending' | 'active' | 'suspended';

export type {
  SubscriptionPlan,
  SubscriptionStatus,
  TenantSubscription,
} from '@costify/shared/domain/subscription';

export interface SessionUser {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  tenantId?: string;
  tenantName?: string;
  workspaceId?: string;
}

export interface PublicUser {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  tenantId?: string;
  status: AccountStatus;
  createdAt: number;
}

export interface PublicTenant {
  tenantId: string;
  name: string;
  contactEmail: string;
  workspaceId: string;
  status: AccountStatus;
  createdAt: number;
  subscription?: import('@costify/shared/domain/subscription').TenantSubscription;
}

export interface AccountDetails {
  user: PublicUser;
  tenant: PublicTenant | null;
}
