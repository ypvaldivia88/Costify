export type {
  UserRole,
  AccountStatus,
  SessionUser,
  PublicUser,
  PublicTenant,
} from '@costify/client-data';

export const USERS_COLLECTION = 'users';
export const TENANTS_COLLECTION = 'tenants';

export interface UserDocument {
  userId: string;
  email: string;
  passwordHash: string;
  role: import('@costify/client-data').UserRole;
  tenantId?: string;
  name: string;
  status: import('@costify/client-data').AccountStatus;
  createdAt: number;
}

export interface TenantDocument {
  tenantId: string;
  name: string;
  contactEmail: string;
  workspaceId: string;
  status: import('@costify/client-data').AccountStatus;
  createdAt: number;
}
