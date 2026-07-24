import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionUser } from '@/auth/types';

const SESSION_CACHE_KEY = 'costify_session_cache';

/** Matches server JWT max age (7 days). */
export const OFFLINE_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface CachedSession {
  user: SessionUser;
  cachedAt: number;
  expiresAt: number;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    return JSON.parse(atob(segment.replace(/-/g, '+').replace(/_/g, '/'))) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

function decodeTokenExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const expiry = decodeTokenExpiryMs(token);
  return expiry != null && expiry <= now;
}

export function parseSessionUserFromToken(token: string): SessionUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const userId = payload.userId;
  const email = payload.email;
  const role = payload.role;
  const name = payload.name;

  if (typeof userId !== 'string' || typeof email !== 'string' || typeof role !== 'string') {
    return null;
  }

  return {
    userId,
    email,
    role: role as SessionUser['role'],
    name: typeof name === 'string' ? name : email,
    tenantId: typeof payload.tenantId === 'string' ? payload.tenantId : undefined,
    tenantName: typeof payload.tenantName === 'string' ? payload.tenantName : undefined,
    workspaceId: typeof payload.workspaceId === 'string' ? payload.workspaceId : undefined,
    accessLevel:
      typeof payload.accessLevel === 'string'
        ? (payload.accessLevel as SessionUser['accessLevel'])
        : undefined,
    trialEndsAt: typeof payload.trialEndsAt === 'number' ? payload.trialEndsAt : undefined,
    trialProductLimit:
      typeof payload.trialProductLimit === 'number' ? payload.trialProductLimit : undefined,
    trialRawMaterialLimit:
      typeof payload.trialRawMaterialLimit === 'number'
        ? payload.trialRawMaterialLimit
        : undefined,
    tenantPending:
      typeof payload.tenantPending === 'boolean' ? payload.tenantPending : undefined,
    subscriptionStatus:
      typeof payload.subscriptionStatus === 'string'
        ? (payload.subscriptionStatus as SessionUser['subscriptionStatus'])
        : undefined,
  };
}

export function isCachedSessionValid(
  cached: CachedSession | null,
  now = Date.now()
): cached is CachedSession {
  return Boolean(cached && cached.expiresAt > now);
}

export async function loadCachedSession(): Promise<CachedSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSession;
    if (!parsed?.user?.userId || !parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCachedSession(user: SessionUser, token: string): Promise<void> {
  const now = Date.now();
  const tokenExpiry = decodeTokenExpiryMs(token);
  const fallbackExpiry = now + OFFLINE_SESSION_MAX_AGE_MS;
  const expiresAt =
    tokenExpiry != null ? Math.min(tokenExpiry, fallbackExpiry) : fallbackExpiry;

  const cached: CachedSession = {
    user,
    cachedAt: now,
    expiresAt,
  };

  await AsyncStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cached));
}

export async function clearCachedSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_CACHE_KEY);
}

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('aborted') ||
    message.includes('timeout')
  );
}
