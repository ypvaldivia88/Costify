import Constants from 'expo-constants';

/**
 * Variables de entorno de la app móvil.
 * Se leen de process.env (Metro) y de app.config.js → extra (release APK).
 */

function readFromProcess(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readFromExtra(key: 'apiUrl' | 'eltoqueApiToken'): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const value = extra?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export const env = {
  apiUrl: readFromProcess('EXPO_PUBLIC_API_URL') ?? readFromExtra('apiUrl'),
  eltoqueApiToken:
    readFromProcess('EXPO_PUBLIC_ELTOQUE_API_TOKEN') ?? readFromExtra('eltoqueApiToken'),
} as const;

export function getApiBaseUrl(): string {
  const base = env.apiUrl;
  if (!base) {
    throw new Error(
      'EXPO_PUBLIC_API_URL no está configurada. Define la URL del backend Costify en .env y vuelve a generar el APK.'
    );
  }
  return base.replace(/\/$/, '');
}

export function hasBackendApi(): boolean {
  return Boolean(env.apiUrl);
}

export function hasDirectEltoqueAccess(): boolean {
  return Boolean(env.eltoqueApiToken);
}
