import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionUser } from '@/auth/types';
import {
  clearCachedSession,
  isCachedSessionValid,
  isNetworkError,
  isTokenExpired,
  loadCachedSession,
  parseSessionUserFromToken,
  saveCachedSession,
} from '@/auth/offline-session';
import { isDeviceOnline, probeConnectivityFast } from '@/config/connectivity';
import { getApiBaseUrl, hasBackendApi } from '@/config/env';

const TOKEN_KEY = 'costify_session_token';

export { hasBackendApi };

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getStoredToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });
}

export async function publicApiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });
}

export interface RegisterRequestInput {
  businessName: string;
  contactEmail?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  plan: import('@costify/shared/domain/subscription').SubscriptionPlan;
  locationCount?: number;
}

export interface RegisterRequestResult {
  planLabel: string;
  priceUsd: number;
  whatsappUrl: string;
  message: string;
}

export async function registerRequest(input: RegisterRequestInput): Promise<RegisterRequestResult> {
  const response = await publicApiFetch('/api/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const json = (await response.json()) as RegisterRequestResult & { error?: string };
  if (!response.ok) {
    throw new Error(json.error || 'No se pudo completar el registro.');
  }
  return {
    planLabel: json.planLabel,
    priceUsd: json.priceUsd,
    whatsappUrl: json.whatsappUrl,
    message: json.message,
  };
}

export async function loginRequest(
  email: string,
  password: string
): Promise<{ user: SessionUser; token: string }> {
  let response: Response;
  try {
    response = await publicApiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error(
        'Sin conexión. Necesitas internet para iniciar sesión por primera vez en este dispositivo.'
      );
    }
    throw error;
  }

  const json = (await response.json()) as {
    user?: SessionUser;
    token?: string;
    error?: string;
  };
  if (!response.ok || !json.user || !json.token) {
    throw new Error(json.error || 'No se pudo iniciar sesión.');
  }
  await setStoredToken(json.token);
  await saveCachedSession(json.user, json.token);
  return { user: json.user, token: json.token };
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignorar errores de red al cerrar sesión.
  }
  await setStoredToken(null);
  await clearCachedSession();
}

export async function requestSubscriptionPlanChange(
  plan: import('@costify/shared/domain/subscription').SubscriptionPlan
): Promise<void> {
  const response = await apiFetch('/api/account/subscription', {
    method: 'PATCH',
    body: JSON.stringify({ plan }),
  });
  const json = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(json.error || 'No se pudo actualizar la suscripción.');
  }
}

type RemoteSessionResult =
  | { kind: 'user'; user: SessionUser; token?: string }
  | { kind: 'unauthorized' }
  | { kind: 'unavailable' };

async function fetchRemoteSession(): Promise<RemoteSessionResult> {
  const token = await getStoredToken();
  if (!token) return { kind: 'unauthorized' };

  try {
    const refreshResponse = await apiFetch('/api/auth/refresh', { method: 'POST' });
    if (refreshResponse.ok) {
      const json = (await refreshResponse.json()) as { user?: SessionUser; token?: string };
      if (json.user) {
        return { kind: 'user', user: json.user, token: json.token };
      }
    }
    if (refreshResponse.status === 401) {
      return { kind: 'unauthorized' };
    }

    const meResponse = await apiFetch('/api/auth/me', { method: 'GET' });
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
    if (isNetworkError(error)) {
      return { kind: 'unavailable' };
    }
    throw error;
  }
}

async function ensureCachedSessionFromToken(token: string): Promise<void> {
  if (isTokenExpired(token)) return;
  const cached = await loadCachedSession();
  if (isCachedSessionValid(cached)) return;

  const user = parseSessionUserFromToken(token);
  if (user) {
    await saveCachedSession(user, token);
  }
}

export async function fetchCurrentUser(): Promise<SessionUser | null> {
  const token = await getStoredToken();
  let cached = await loadCachedSession();

  if (token) {
    await ensureCachedSessionFromToken(token);
    cached = await loadCachedSession();
  }

  const cachedUser = isCachedSessionValid(cached)
    ? cached.user
    : token && !isTokenExpired(token)
      ? parseSessionUserFromToken(token)
      : null;

  if (!cachedUser) {
    if (token) {
      await setStoredToken(null);
      await clearCachedSession();
    }
    return null;
  }

  if (!hasBackendApi() || !token) {
    return cachedUser;
  }

  if (!isDeviceOnline()) {
    return cachedUser;
  }

  const online = await probeConnectivityFast();
  if (!online) {
    return cachedUser;
  }

  const remote = await fetchRemoteSession();

  if (remote.kind === 'user') {
    if (remote.token) {
      await setStoredToken(remote.token);
    }
    await saveCachedSession(remote.user, remote.token ?? token);
    return remote.user;
  }

  if (remote.kind === 'unauthorized') {
    await setStoredToken(null);
    await clearCachedSession();
    return null;
  }

  return cachedUser;
}
