import Constants from 'expo-constants';
import { COSTIFY_API_BASE_URL } from '@costify/shared/config/api';

/**
 * Variables de entorno de la app móvil.
 * El backend es `apps/web` (Next.js). La URL por defecto apunta al despliegue en Vercel.
 */

function readFromProcess(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readFromExtra(key: 'apiUrl' | 'eltoqueApiToken'): string | undefined {
  const candidates: Array<Record<string, unknown> | undefined> = [
    Constants.expoConfig?.extra as Record<string, unknown> | undefined,
    (Constants as { manifest?: { extra?: Record<string, unknown> } }).manifest?.extra,
    (Constants.manifest2 as { extra?: Record<string, unknown> } | null)?.extra,
  ];

  for (const extra of candidates) {
    const value = extra?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function resolveApiUrl(): string {
  return readFromProcess('EXPO_PUBLIC_API_URL') ?? readFromExtra('apiUrl') ?? COSTIFY_API_BASE_URL;
}

function resolveEltoqueApiToken(): string | undefined {
  return readFromProcess('EXPO_PUBLIC_ELTOQUE_API_TOKEN') ?? readFromExtra('eltoqueApiToken');
}

export function getApiBaseUrl(): string {
  return resolveApiUrl().replace(/\/$/, '');
}

export function hasBackendApi(): boolean {
  return Boolean(resolveApiUrl());
}

export function getEltoqueApiToken(): string | undefined {
  return resolveEltoqueApiToken();
}

export function hasDirectEltoqueAccess(): boolean {
  return Boolean(resolveEltoqueApiToken());
}

/** @deprecated Usar getApiBaseUrl() / getEltoqueApiToken() — se resuelven en runtime. */
export const env = {
  get apiUrl() {
    return resolveApiUrl();
  },
  get eltoqueApiToken() {
    return resolveEltoqueApiToken();
  },
} as const;
