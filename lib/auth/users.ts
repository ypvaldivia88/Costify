import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db/mongodb';
import { USERS_COLLECTION, type UserDocument } from '@/lib/auth/types';
import { hashPassword } from '@/lib/auth/password';

export async function ensureSuperAdmin(): Promise<void> {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) return;

  const db = await getDb();
  const users = db.collection<UserDocument>(USERS_COLLECTION);
  const existing = await users.findOne({ role: 'super_admin' });
  if (existing) return;

  await users.insertOne({
    userId: randomUUID(),
    email,
    passwordHash: await hashPassword(password),
    role: 'super_admin',
    name: process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin',
    status: 'active',
    createdAt: Date.now(),
  });
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
