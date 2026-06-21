import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db/mongodb';
import { USERS_COLLECTION, type UserDocument } from '@/lib/auth/types';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

function getSuperAdminConfig() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin';
  return { email, password, name };
}

export function isSuperAdminBootstrapConfigured(): boolean {
  const { email, password } = getSuperAdminConfig();
  return Boolean(email && password);
}

export async function ensureSuperAdmin(): Promise<UserDocument | null> {
  const { email, password, name } = getSuperAdminConfig();
  if (!email || !password) return null;

  const db = await getDb();
  const users = db.collection<UserDocument>(USERS_COLLECTION);
  const passwordHash = await hashPassword(password);

  const byEmail = await users.findOne({ email });
  if (byEmail?.role === 'super_admin') {
    const passwordMatches = await verifyPassword(password, byEmail.passwordHash);
    if (!passwordMatches || byEmail.name !== name || byEmail.status !== 'active') {
      await users.updateOne(
        { userId: byEmail.userId },
        { $set: { passwordHash, name, status: 'active' } }
      );
      return { ...byEmail, passwordHash, name, status: 'active' };
    }
    return byEmail;
  }

  const existingSuperAdmin = await users.findOne({ role: 'super_admin' });
  if (existingSuperAdmin) {
    await users.updateOne(
      { userId: existingSuperAdmin.userId },
      { $set: { email, passwordHash, name, status: 'active' } }
    );
    return {
      ...existingSuperAdmin,
      email,
      passwordHash,
      name,
      status: 'active',
    };
  }

  const created: UserDocument = {
    userId: randomUUID(),
    email,
    passwordHash,
    role: 'super_admin',
    name,
    status: 'active',
    createdAt: Date.now(),
  };
  await users.insertOne(created);
  return created;
}

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  const db = await getDb();
  return db.collection<UserDocument>(USERS_COLLECTION).findOne({
    email: email.trim().toLowerCase(),
  });
}

export async function findUserById(userId: string): Promise<UserDocument | null> {
  const db = await getDb();
  return db.collection<UserDocument>(USERS_COLLECTION).findOne({ userId });
}
