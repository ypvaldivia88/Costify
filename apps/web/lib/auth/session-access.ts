import { findTenantById } from '@/lib/auth/tenants';
import { findUserById } from '@/lib/auth/users';
import type { SessionUser } from '@/lib/auth/types';
import { resolveTenantAccess } from '@costify/shared/domain/access';

export async function enrichSessionUser(session: SessionUser): Promise<SessionUser> {
  if (!session.tenantId || session.role === 'super_admin') {
    return session;
  }

  const [tenant, user] = await Promise.all([
    findTenantById(session.tenantId),
    findUserById(session.userId),
  ]);

  if (!tenant || !user) {
    return session;
  }

  const access = resolveTenantAccess({
    tenantStatus: tenant.status,
    userStatus: user.status,
    tenantCreatedAt: tenant.createdAt,
    subscription: tenant.subscription,
  });

  return {
    ...session,
    tenantName: tenant.name,
    workspaceId: tenant.workspaceId,
    accessLevel: access.level,
    trialEndsAt: access.trialEndsAt,
    trialProductLimit: access.productLimit,
    trialRawMaterialLimit: access.rawMaterialLimit,
    tenantPending: access.tenantPending,
    subscriptionStatus: access.subscriptionStatus,
  };
}
