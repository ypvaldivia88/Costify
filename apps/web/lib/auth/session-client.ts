import type { SessionUser } from '@/lib/auth/types';
import {
  clearCachedSession,
  isBrowserOffline,
  isCachedSessionValid,
  isNetworkError,
  isTokenExpired,
  loadCachedSession,
  getStoredSessionToken,
  saveCachedSession,
} from '@/lib/auth/offline-session';

type RemoteSessionResult =
  | { kind: 'user'; user: SessionUser; token?: string }
  | { kind: 'unauthorized' }
  | { kind: 'unavailable' };

async function fetchRemoteSession(): Promise<RemoteSessionResult> {
  try {
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    });

    if (refreshResponse.ok) {
      const json = (await refreshResponse.json()) as { user?: SessionUser; token?: string };
      if (json.user) {
        return { kind: 'user', user: json.user, token: json.token };
      }
    }

    if (refreshResponse.status === 401) {
      return { kind: 'unauthorized' };
    }

    const meResponse = await fetch('/api/auth/me', {
      credentials: 'include',
      cache: 'no-store',
    });

    if (meResponse.ok) {
      const json = (await meResponse.json()) as { user?: SessionUser };
      if (json.user) {
        return { kind: 'user', user: json.user };
      }
    }

    if (meResponse.status === 401) {
      return { kind: 'unauthorized' };
    }

    return { kind: 'unavailable' };
  } catch (error) {
    if (isNetworkError(error) || isBrowserOffline()) {
      return { kind: 'unavailable' };
    }
    throw error;
  }
}

function resolveLocalUser(): SessionUser | null {
  const cached = loadCachedSession();
  if (isCachedSessionValid(cached)) {
    return cached.user;
  }

  const token = getStoredSessionToken();
  if (token && !isTokenExpired(token)) {
    const payload = decodeJwtUser(token);
    if (payload) return payload;
  }

  return null;
}

function decodeJwtUser(token: string): SessionUser | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const payload = JSON.parse(atob(segment.replace(/-/g, '+').replace(/_/g, '/'))) as SessionUser;
    if (!payload.userId || !payload.email || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function fetchCurrentSession(): Promise<SessionUser | null> {
  const localUser = resolveLocalUser();

  if (isBrowserOffline()) {
    return localUser;
  }

  const remote = await fetchRemoteSession();

  if (remote.kind === 'user') {
    saveCachedSession(remote.user, remote.token);
    return remote.user;
  }

  if (remote.kind === 'unauthorized') {
    clearCachedSession();
    return null;
  }

  return localUser;
}
