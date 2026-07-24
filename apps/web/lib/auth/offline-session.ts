import type { SessionUser } from '@/lib/auth/types';

export const SESSION_CACHE_KEY = 'costify_session_cache';
export const SESSION_TOKEN_KEY = 'costify_session_token';

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

export function isCachedSessionValid(
  cached: CachedSession | null,
  now = Date.now()
): cached is CachedSession {
  return Boolean(cached && cached.expiresAt > now);
}

export function loadCachedSession(): CachedSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSession;
    if (!parsed?.user?.userId || !parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCachedSession(user: SessionUser, token?: string): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const tokenExpiry = token ? decodeTokenExpiryMs(token) : null;
  const fallbackExpiry = now + OFFLINE_SESSION_MAX_AGE_MS;
  const expiresAt =
    tokenExpiry != null ? Math.min(tokenExpiry, fallbackExpiry) : fallbackExpiry;

  const cached: CachedSession = {
    user,
    cachedAt: now,
    expiresAt,
  };

  localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cached));
  if (token) {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
}

export function clearCachedSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_CACHE_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

export function getStoredSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof TypeError) && !(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed') ||
    message.includes('aborted')
  );
}

export function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}
