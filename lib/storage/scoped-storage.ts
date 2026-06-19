const SCOPE_KEY = 'costify_tenant_scope';

export function setStorageScope(tenantId: string | null): void {
  if (typeof window === 'undefined') return;
  if (tenantId) {
    sessionStorage.setItem(SCOPE_KEY, tenantId);
  } else {
    sessionStorage.removeItem(SCOPE_KEY);
  }
}

export function getStorageScope(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(SCOPE_KEY);
}

export function scopedStorageKey(key: string): string {
  const scope = getStorageScope();
  if (!scope) return key;
  return `${scope}__${key}`;
}
