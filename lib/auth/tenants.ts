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
  DEFAULT_TAX_SETTINGS,
} from '@/lib/domain/constants';
import { DEFAULT_UNIT_SETTINGS } from '@/lib/domain/unit-settings';

export async function listTenants(): Promise<PublicTenant[]> {
  const db = await getDb();
  const tenants = await db
    .collection<TenantDocument>(TENANTS_COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return tenants.map(({ tenantId, name, contactEmail, workspaceId, status, createdAt }) => ({
    tenantId,
    name,
    contactEmail,
    workspaceId,
    status,
    createdAt,
  }));
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
}

export async function createTenantWithAdmin(input: CreateTenantInput): Promise<{
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

  const existingUser = await users.findOne({ email: adminEmail });
  if (existingUser) {
    throw new Error('Ya existe un usuario con ese correo.');
  }

  const tenant: TenantDocument = {
    tenantId,
    name: input.name.trim(),
    contactEmail: input.contactEmail.trim().toLowerCase(),
    workspaceId,
    status: 'active',
    createdAt: now,
  };

  const admin: UserDocument = {
    userId: randomUUID(),
    email: adminEmail,
    passwordHash: await hashPassword(input.adminPassword),
    role: 'tenant_admin',
    tenantId,
    name: input.adminName.trim(),
    status: 'active',
    createdAt: now,
  };

  const workspace: WorkspaceDocument = {
    workspaceId,
    tenantId,
    inventory: [],
    rawMaterials: [],
    globalCosts: [],
    globalFund: DEFAULT_GLOBAL_FUND_SETTINGS,
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
    tenant: {
      tenantId: tenant.tenantId,
      name: tenant.name,
      contactEmail: tenant.contactEmail,
      workspaceId: tenant.workspaceId,
      status: tenant.status,
      createdAt: tenant.createdAt,
    },
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
  const result = await tenants.findOneAndUpdate(
    { tenantId },
    { $set: { status } },
    { returnDocument: 'after' }
  );

  if (!result) return null;

  return {
    tenantId: result.tenantId,
    name: result.name,
    contactEmail: result.contactEmail,
    workspaceId: result.workspaceId,
    status: result.status,
    createdAt: result.createdAt,
  };
}
