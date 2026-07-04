export type UserRole = 'super_admin' | 'tenant_admin' | 'tenant_user';
export type AccountStatus = 'active' | 'suspended';

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
}

export interface AccountDetails {
  user: PublicUser;
  tenant: PublicTenant | null;
}
