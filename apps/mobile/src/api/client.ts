import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionUser } from '@/auth/types';
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
  const response = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const json = (await response.json()) as {
    user?: SessionUser;
    token?: string;
    error?: string;
  };
  if (!response.ok || !json.user || !json.token) {
    throw new Error(json.error || 'No se pudo iniciar sesión.');
  }
  await setStoredToken(json.token);
  return { user: json.user, token: json.token };
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignorar errores de red al cerrar sesión.
  }
  await setStoredToken(null);
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

export async function fetchCurrentUser(): Promise<SessionUser | null> {
  const token = await getStoredToken();
  if (!token) return null;

  const response = await apiFetch('/api/auth/me', { method: 'GET' });
  if (!response.ok) {
    if (response.status === 401) {
      await setStoredToken(null);
    }
    return null;
  }

  const json = (await response.json()) as { user?: SessionUser };
  return json.user ?? null;
}
