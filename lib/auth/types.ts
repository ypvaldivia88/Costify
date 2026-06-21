export const USERS_COLLECTION = 'users';
export const TENANTS_COLLECTION = 'tenants';

export type UserRole = 'super_admin' | 'tenant_admin' | 'tenant_user';
export type AccountStatus = 'active' | 'suspended';

export interface UserDocument {
  userId: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  tenantId?: string;
  name: string;
  status: AccountStatus;
  createdAt: number;
}

export interface TenantDocument {
  tenantId: string;
  name: string;
  contactEmail: string;
  workspaceId: string;
  status: AccountStatus;
  createdAt: number;
}

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
