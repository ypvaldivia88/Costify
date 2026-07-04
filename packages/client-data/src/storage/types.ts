export const DEFAULT_UNSCOPED_STORAGE_KEYS = new Set([
  'costify_theme_v1',
  'costify_tenant_scope',
  'costify_session_token',
]);

export interface ScopeStorage {
  getScope(): Promise<string | null>;
  setScope(tenantId: string | null): Promise<void>;
}

export interface StoragePort {
  load<T>(key: string, fallback: T): Promise<T>;
  save<T>(key: string, value: T): Promise<void>;
  getRawItem(key: string): Promise<string | null>;
  setRawItem(key: string, value: string): Promise<void>;
  removeRawItem(key: string): Promise<void>;
}

export interface ScopedStoragePort extends StoragePort {
  resolveKey(key: string): Promise<string>;
}

export function createScopedStoragePort(
  storage: StoragePort,
  scopeStorage: ScopeStorage,
  unscopedKeys: Set<string> = DEFAULT_UNSCOPED_STORAGE_KEYS
): ScopedStoragePort {
  async function resolveKey(key: string): Promise<string> {
    if (unscopedKeys.has(key)) return key;
    const scope = await scopeStorage.getScope();
    if (!scope) return key;
    return `${scope}__${key}`;
  }

  return {
    resolveKey,
    async load<T>(key: string, fallback: T): Promise<T> {
      try {
        const resolved = await resolveKey(key);
        const saved = await storage.getRawItem(resolved);
        if (!saved) return fallback;
        return JSON.parse(saved) as T;
      } catch {
        return fallback;
      }
    },
    async save<T>(key: string, value: T): Promise<void> {
      const resolved = await resolveKey(key);
      await storage.setRawItem(resolved, JSON.stringify(value));
    },
    getRawItem: storage.getRawItem,
    setRawItem: storage.setRawItem,
    removeRawItem: storage.removeRawItem,
  };
}

export function migrateLegacyInventoryFromRaw(raw: string | null): unknown[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return parsed.map((item) => ({
      ...item,
      productType: item.productType ?? 'simple',
      marginType: item.marginType ?? 'markup',
      totalIndirectPerUnit:
        item.totalIndirectPerUnit ??
        (item.totalUnitCost
          ? (item.totalUnitCost as number) - (item.unitCost as number)
          : 0),
      grossMarginPercent: item.grossMarginPercent ?? 0,
      indirectBreakdown: item.indirectBreakdown ?? [],
    }));
  } catch {
    return [];
  }
}

export async function migrateLegacyInventory(storage: StoragePort): Promise<unknown[]> {
  const legacy = await storage.getRawItem('costify_inventory');
  return migrateLegacyInventoryFromRaw(legacy);
}

export async function migrateLegacyGlobalCosts(storage: StoragePort): Promise<unknown[]> {
  const legacy = await storage.getRawItem('costify_global_costs');
  if (!legacy) return [];
  try {
    return JSON.parse(legacy) as unknown[];
  } catch {
    return [];
  }
}
