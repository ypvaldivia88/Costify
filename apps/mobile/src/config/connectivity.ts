import { AppState, type AppStateStatus } from 'react-native';
import { getApiBaseUrl, hasBackendApi } from '@/config/env';

let online = true;
const listeners = new Set<(next: boolean) => void>();
let monitorStop: (() => void) | null = null;

function notify(next: boolean) {
  if (next === online) return;
  online = next;
  listeners.forEach((listener) => listener(next));
}

async function probeOnline(timeoutMs = 8000): Promise<boolean> {
  try {
    const url = hasBackendApi()
      ? `${getApiBaseUrl()}/api/health`
      : 'https://clients3.google.com/generate_204';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

export function isDeviceOnline(): boolean {
  return online;
}

/** Re-check connectivity and update cached online state. */
export async function probeConnectivity(): Promise<boolean> {
  const next = await probeOnline();
  notify(next);
  return next;
}

/** Faster probe for auth bootstrap — avoids long waits when offline. */
export async function probeConnectivityFast(): Promise<boolean> {
  const next = await probeOnline(2500);
  notify(next);
  return next;
}

export function subscribeConnectivity(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  const listener = (next: boolean) => {
    if (next) onOnline();
    else onOffline();
  };
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ensureConnectivityMonitoring(): () => void {
  if (monitorStop) return monitorStop;

  void probeOnline().then(notify);
  const interval = setInterval(() => {
    void probeOnline().then(notify);
  }, 15000);

  const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      void probeOnline().then(notify);
    }
  });

  monitorStop = () => {
    clearInterval(interval);
    appStateSub.remove();
    monitorStop = null;
  };

  return monitorStop;
}
