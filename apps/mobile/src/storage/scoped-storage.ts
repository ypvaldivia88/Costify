import AsyncStorage from '@react-native-async-storage/async-storage';

const SCOPE_KEY = 'costify_tenant_scope';

let memoryScope: string | null = null;

export async function setStorageScope(tenantId: string | null): Promise<void> {
  memoryScope = tenantId;
  if (tenantId) {
    await AsyncStorage.setItem(SCOPE_KEY, tenantId);
    return;
  }
  await AsyncStorage.removeItem(SCOPE_KEY);
}

export async function loadStorageScope(): Promise<string | null> {
  if (memoryScope) return memoryScope;
  memoryScope = await AsyncStorage.getItem(SCOPE_KEY);
  return memoryScope;
}

export function getStorageScopeSync(): string | null {
  return memoryScope;
}

export function scopedStorageKey(key: string, scope = memoryScope): string {
  if (!scope) return key;
  return `${scope}__${key}`;
}
