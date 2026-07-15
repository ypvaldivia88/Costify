import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db/mongodb';
import {
  TENANTS_COLLECTION,
  USERS_COLLECTION,
  type PublicTenant,
  type PublicUser,
  type TenantDocument,
  type UserDocument,
  type UserRole,
} from '@/lib/auth/types';
import { hashPassword } from '@/lib/auth/password';
import { WORKSPACES_COLLECTION, type WorkspaceDocument } from '@/lib/db/workspace';
import {
  DEFAULT_GLOBAL_FUND_SETTINGS,
  DEFAULT_LABOR_SHARE_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@costify/shared/domain/constants';
import { DEFAULT_UNIT_SETTINGS } from '@costify/shared/domain/unit-settings';
import {
  activateSubscription,
  applySubscriptionAdminAction,
  buildPendingSubscription,
  changeSubscriptionPlan,
  ensureTenantSubscription,
  isSubscriptionCurrentlyActive,
  type SubscriptionAdminAction,
  type SubscriptionPlan,
  type TenantSubscription,
} from '@costify/shared/domain/subscription';

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

export async function listTenants(): Promise<PublicTenant[]> {
  const db = await getDb();
  const tenants = await db
    .collection<TenantDocument>(TENANTS_COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return tenants.map(toPublicTenant);
}

export async function listPendingTenants(): Promise<PublicTenant[]> {
  const db = await getDb();
  const tenants = await db
    .collection<TenantDocument>(TENANTS_COLLECTION)
    .find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .toArray();

  return tenants.map(toPublicTenant);
}

export async function listTenantUsers(tenantId: string): Promise<PublicUser[]> {
  const db = await getDb();
  const users = await db
    .collection<UserDocument>(USERS_COLLECTION)
    .find({ tenantId })
    .sort({ createdAt: -1 })
    .toArray();

  return users.map(({ userId, email, role, name, tenantId: tid, status, createdAt }) => ({
    userId,
    email,
    role,
    name,
    tenantId: tid,
    status,
    createdAt,
  }));
}

export async function findTenantById(tenantId: string): Promise<TenantDocument | null> {
  const db = await getDb();
  return db.collection<TenantDocument>(TENANTS_COLLECTION).findOne({ tenantId });
}

interface CreateTenantInput {
  name: string;
  contactEmail: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  status?: TenantDocument['status'];
  subscription?: TenantSubscription;
}

async function insertTenantBundle(input: CreateTenantInput): Promise<{
  tenant: PublicTenant;
  admin: PublicUser;
}> {
  const db = await getDb();
  const tenants = db.collection<TenantDocument>(TENANTS_COLLECTION);
  const users = db.collection<UserDocument>(USERS_COLLECTION);
  const workspaces = db.collection<WorkspaceDocument>(WORKSPACES_COLLECTION);

  const tenantId = randomUUID();
  const workspaceId = tenantId;
  const now = Date.now();
  const adminEmail = input.adminEmail.trim().toLowerCase();
  const status = input.status ?? 'active';

  const existingUser = await users.findOne({ email: adminEmail });
  if (existingUser) {
    throw new Error('Ya existe un usuario con ese correo.');
  }

  const tenant: TenantDocument = {
    tenantId,
    name: input.name.trim(),
    contactEmail: input.contactEmail.trim().toLowerCase(),
    workspaceId,
    status,
    createdAt: now,
    subscription: input.subscription,
  };

  const admin: UserDocument = {
    userId: randomUUID(),
    email: adminEmail,
    passwordHash: await hashPassword(input.adminPassword),
    role: 'tenant_admin',
    tenantId,
    name: input.adminName.trim(),
    status,
    createdAt: now,
  };

  const workspace: WorkspaceDocument = {
    workspaceId,
    tenantId,
    inventory: [],
    rawMaterials: [],
    globalCosts: [],
    globalFund: DEFAULT_GLOBAL_FUND_SETTINGS,
    laborShareSettings: DEFAULT_LABOR_SHARE_SETTINGS,
    taxSettings: DEFAULT_TAX_SETTINGS,
    unitSettings: DEFAULT_UNIT_SETTINGS,
    warehouses: [],
    stockMovements: [],
    stockThresholds: [],
    updatedAt: now,
    createdAt: now,
  };

  await tenants.insertOne(tenant);
  await users.insertOne(admin);
  await workspaces.insertOne(workspace);

  return {
    tenant: toPublicTenant(tenant),
    admin: {
      userId: admin.userId,
      email: admin.email,
      role: admin.role,
      name: admin.name,
      tenantId: admin.tenantId,
      status: admin.status,
      createdAt: admin.createdAt,
    },
  };
}

export async function createTenantWithAdmin(input: CreateTenantInput): Promise<{
  tenant: PublicTenant;
  admin: PublicUser;
}> {
  const subscription = activateSubscription(buildPendingSubscription('monthly'));
  return insertTenantBundle({
    ...input,
    status: 'active',
    subscription,
  });
}

interface RegisterTenantInput {
  name: string;
  contactEmail: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  plan: SubscriptionPlan;
  locationCount?: number;
}

export async function registerPendingTenant(input: RegisterTenantInput): Promise<{
  tenant: PublicTenant;
  admin: PublicUser;
}> {
  return insertTenantBundle({
    name: input.name,
    contactEmail: input.contactEmail,
    adminName: input.adminName,
    adminEmail: input.adminEmail,
    adminPassword: input.adminPassword,
    status: 'pending',
    subscription: buildPendingSubscription(input.plan, Date.now(), input.locationCount),
  });
}

export async function ensureTenantSubscriptionActive(
  tenantId: string
): Promise<PublicTenant | null> {
  const tenant = await findTenantById(tenantId);
  if (!tenant) return null;

  const subscription = ensureTenantSubscription(tenant.subscription);
  if (isSubscriptionCurrentlyActive(subscription)) {
    return toPublicTenant(tenant);
  }

  const db = await getDb();
  const result = await db.collection<TenantDocument>(TENANTS_COLLECTION).findOneAndUpdate(
    { tenantId },
    {
      $set: {
        status: 'active',
        subscription: activateSubscription(subscription),
      },
    },
    { returnDocument: 'after' }
  );

  if (!result) return null;

  await db
    .collection<UserDocument>(USERS_COLLECTION)
    .updateMany({ tenantId }, { $set: { status: 'active' } });

  return toPublicTenant(result);
}

export async function approveTenant(tenantId: string): Promise<PublicTenant | null> {
  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    throw new Error('Cliente no encontrado.');
  }

  if (tenant.status === 'active') {
    return ensureTenantSubscriptionActive(tenantId);
  }

  if (tenant.status !== 'pending') {
    throw new Error('El cliente no está pendiente de aprobación.');
  }

  return ensureTenantSubscriptionActive(tenantId);
}

const DEMO_ADMIN_EMAIL = (process.env.DEMO_ADMIN_EMAIL ?? 'demo@costify.local')
  .trim()
  .toLowerCase();

/** Keeps the staging demo tenant writable after trial expiry. */
export async function ensureDemoTenantSubscription(): Promise<void> {
  const db = await getDb();
  const demoAdmin = await db.collection<UserDocument>(USERS_COLLECTION).findOne({
    email: DEMO_ADMIN_EMAIL,
    role: 'tenant_admin',
  });
  if (!demoAdmin?.tenantId) return;

  await ensureTenantSubscriptionActive(demoAdmin.tenantId);
}

interface CreateTenantUserInput {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role?: Extract<UserRole, 'tenant_admin' | 'tenant_user'>;
}

export async function createTenantUser(input: CreateTenantUserInput): Promise<PublicUser> {
  const tenant = await findTenantById(input.tenantId);
  if (!tenant) {
    throw new Error('Cliente no encontrado.');
  }

  const db = await getDb();
  const users = db.collection<UserDocument>(USERS_COLLECTION);
  const email = input.email.trim().toLowerCase();
  const existingUser = await users.findOne({ email });
  if (existingUser) {
    throw new Error('Ya existe un usuario con ese correo.');
  }

  const user: UserDocument = {
    userId: randomUUID(),
    email,
    passwordHash: await hashPassword(input.password),
    role: input.role ?? 'tenant_user',
    tenantId: input.tenantId,
    name: input.name.trim(),
    status: 'active',
    createdAt: Date.now(),
  };

  await users.insertOne(user);

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

export async function updateTenantStatus(
  tenantId: string,
  status: TenantDocument['status']
): Promise<PublicTenant | null> {
  const db = await getDb();
  const tenants = db.collection<TenantDocument>(TENANTS_COLLECTION);
  const existing = await tenants.findOne({ tenantId });
  if (!existing) return null;

  const update: Partial<TenantDocument> = { status };

  if (status === 'active') {
    const subscription = ensureTenantSubscription(existing.subscription);
    if (!isSubscriptionCurrentlyActive(subscription)) {
      update.subscription = activateSubscription(subscription);
    }
  }

  const result = await tenants.findOneAndUpdate(
    { tenantId },
    { $set: update },
    { returnDocument: 'after' }
  );

  if (!result) return null;

  if (status === 'active') {
    await db
      .collection<UserDocument>(USERS_COLLECTION)
      .updateMany({ tenantId }, { $set: { status: 'active' } });
  }

  return toPublicTenant(result);
}

export async function rejectPendingTenant(tenantId: string): Promise<boolean> {
  const tenant = await findTenantById(tenantId);
  if (!tenant || tenant.status !== 'pending') {
    throw new Error('El cliente no está pendiente de aprobación.');
  }

  const db = await getDb();
  await db.collection<UserDocument>(USERS_COLLECTION).deleteMany({ tenantId });
  await db.collection(WORKSPACES_COLLECTION).deleteOne({ workspaceId: tenant.workspaceId });
  const result = await db.collection<TenantDocument>(TENANTS_COLLECTION).deleteOne({ tenantId });
  return result.deletedCount === 1;
}

export async function updateTenantSubscription(
  tenantId: string,
  action: SubscriptionAdminAction,
  plan?: SubscriptionPlan,
  locationCount?: number
): Promise<PublicTenant | null> {
  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    throw new Error('Cliente no encontrado.');
  }

  const current = ensureTenantSubscription(tenant.subscription);
  const subscription = applySubscriptionAdminAction(current, action, plan, locationCount);

  const db = await getDb();
  const result = await db.collection<TenantDocument>(TENANTS_COLLECTION).findOneAndUpdate(
    { tenantId },
    { $set: { subscription } },
    { returnDocument: 'after' }
  );

  if (!result) return null;
  return toPublicTenant(result);
}

export async function updateTenantUserPassword(
  tenantId: string,
  userId: string,
  password: string
): Promise<PublicUser | null> {
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }

  const tenant = await findTenantById(tenantId);
  if (!tenant) {
    throw new Error('Cliente no encontrado.');
  }

  const db = await getDb();
  const users = db.collection<UserDocument>(USERS_COLLECTION);
  const result = await users.findOneAndUpdate(
    { userId, tenantId },
    { $set: { passwordHash: await hashPassword(password) } },
    { returnDocument: 'after' }
  );

  if (!result) return null;

  return {
    userId: result.userId,
    email: result.email,
    role: result.role,
    name: result.name,
    tenantId: result.tenantId,
    status: result.status,
    createdAt: result.createdAt,
  };
}
