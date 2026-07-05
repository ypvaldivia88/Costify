import { getDb } from '@/lib/db/mongodb';
import {
  TENANTS_COLLECTION,
  USERS_COLLECTION,
  type PublicTenant,
  type PublicUser,
  type SessionUser,
  type TenantDocument,
  type UserDocument,
} from '@/lib/auth/types';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { findTenantById } from '@/lib/auth/tenants';
import { findUserByEmail, findUserById } from '@/lib/auth/users';
import { WORKSPACES_COLLECTION } from '@/lib/db/workspace';
import {
  changeSubscriptionPlan,
  ensureTenantSubscription,
  type SubscriptionPlan,
} from '@costify/shared/domain/subscription';

export interface AccountDetails {
  user: PublicUser;
  tenant: PublicTenant | null;
}

function toPublicUser(user: UserDocument): PublicUser {
  return {
    userId: user.userId,
    email: user.email,
    role: user.role,
    name: user.name,
    tenantId: user.tenantId,
    status: user.status,
    createdAt: user.createdAt,
  };
}

function toPublicTenant(tenant: TenantDocument): PublicTenant {
  return {
    tenantId: tenant.tenantId,
    name: tenant.name,
    contactEmail: tenant.contactEmail,
    workspaceId: tenant.workspaceId,
    status: tenant.status,
    createdAt: tenant.createdAt,
    subscription: ensureTenantSubscription(tenant.subscription),
  };
}

export async function getAccountDetails(userId: string): Promise<AccountDetails | null> {
  const user = await findUserById(userId);
  if (!user) return null;

  const tenant = user.tenantId ? await findTenantById(user.tenantId) : null;
  return {
    user: toPublicUser(user),
    tenant: tenant ? toPublicTenant(tenant) : null,
  };
}

async function buildSessionUser(user: UserDocument): Promise<SessionUser> {
  const sessionUser: SessionUser = {
    userId: user.userId,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  if (user.tenantId) {
    const tenant = await findTenantById(user.tenantId);
    if (tenant) {
      sessionUser.tenantId = tenant.tenantId;
      sessionUser.tenantName = tenant.name;
      sessionUser.workspaceId = tenant.workspaceId;
    }
  }

  return sessionUser;
}

export interface UpdateAccountInput {
  name?: string;
  email?: string;
  businessName?: string;
  contactEmail?: string;
}

export async function updateAccountProfile(
  userId: string,
  input: UpdateAccountInput
): Promise<SessionUser> {
  const user = await findUserById(userId);
  if (!user || user.status !== 'active') {
    throw new Error('Cuenta no encontrada o inactiva.');
  }

  const db = await getDb();
  const users = db.collection<UserDocument>(USERS_COLLECTION);
  const updates: Partial<UserDocument> = {};

  if (input.name?.trim()) {
    updates.name = input.name.trim();
  }

  if (input.email?.trim()) {
    const email = input.email.trim().toLowerCase();
    const existing = await findUserByEmail(email);
    if (existing && existing.userId !== userId) {
      throw new Error('Ya existe otra cuenta con ese correo.');
    }
    updates.email = email;
  }

  if (Object.keys(updates).length > 0) {
    await users.updateOne({ userId }, { $set: updates });
  }

  if (user.tenantId && user.role === 'tenant_admin') {
    const tenantUpdates: Partial<TenantDocument> = {};
    if (input.businessName?.trim()) {
      tenantUpdates.name = input.businessName.trim();
    }
    if (input.contactEmail?.trim()) {
      tenantUpdates.contactEmail = input.contactEmail.trim().toLowerCase();
    }
    if (Object.keys(tenantUpdates).length > 0) {
      await db
        .collection<TenantDocument>(TENANTS_COLLECTION)
        .updateOne({ tenantId: user.tenantId }, { $set: tenantUpdates });
    }
  }

  const updated = await findUserById(userId);
  if (!updated) {
    throw new Error('No se pudo actualizar la cuenta.');
  }

  return buildSessionUser(updated);
}

export async function requestSubscriptionPlanChange(
  userId: string,
  plan: SubscriptionPlan
): Promise<AccountDetails> {
  const user = await findUserById(userId);
  if (!user?.tenantId || user.role !== 'tenant_admin') {
    throw new Error('Solo el administrador del negocio puede gestionar la suscripción.');
  }

  const tenant = await findTenantById(user.tenantId);
  if (!tenant) {
    throw new Error('Negocio no encontrado.');
  }

  const subscription = changeSubscriptionPlan(ensureTenantSubscription(tenant.subscription), plan);

  const db = await getDb();
  await db
    .collection<TenantDocument>(TENANTS_COLLECTION)
    .updateOne({ tenantId: user.tenantId }, { $set: { subscription } });

  const account = await getAccountDetails(userId);
  if (!account) {
    throw new Error('No se pudo actualizar la suscripción.');
  }
  return account;
}

export async function changeAccountPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new Error('Cuenta no encontrada.');
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error('La contraseña actual no es correcta.');
  }

  const db = await getDb();
  await db.collection<UserDocument>(USERS_COLLECTION).updateOne(
    { userId },
    { $set: { passwordHash: await hashPassword(newPassword) } }
  );
}

export async function suspendAccount(userId: string, password: string): Promise<void> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('Cuenta no encontrada.');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error('La contraseña no es correcta.');
  }

  const db = await getDb();
  await db.collection<UserDocument>(USERS_COLLECTION).updateOne(
    { userId },
    { $set: { status: 'suspended' } }
  );
}

export async function deleteAccount(userId: string, password: string): Promise<void> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('Cuenta no encontrada.');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error('La contraseña no es correcta.');
  }

  const db = await getDb();

  if (user.tenantId) {
    const tenantUsers = await db
      .collection<UserDocument>(USERS_COLLECTION)
      .find({ tenantId: user.tenantId })
      .toArray();

    const remainingUsers = tenantUsers.filter((item) => item.userId !== userId);
    const isLastUser = remainingUsers.length === 0;

    await db.collection<UserDocument>(USERS_COLLECTION).deleteOne({ userId });

    if (isLastUser) {
      await db.collection<TenantDocument>(TENANTS_COLLECTION).deleteOne({ tenantId: user.tenantId });
      await db.collection(WORKSPACES_COLLECTION).deleteOne({ workspaceId: user.tenantId });
      return;
    }

    const hasAdmin = remainingUsers.some((item) => item.role === 'tenant_admin');
    if (!hasAdmin && user.role === 'tenant_admin') {
      const nextAdmin = remainingUsers.sort((a, b) => a.createdAt - b.createdAt)[0];
      if (nextAdmin) {
        await db
          .collection<UserDocument>(USERS_COLLECTION)
          .updateOne({ userId: nextAdmin.userId }, { $set: { role: 'tenant_admin' } });
      }
    }

    return;
  }

  await db.collection<UserDocument>(USERS_COLLECTION).deleteOne({ userId });
}
