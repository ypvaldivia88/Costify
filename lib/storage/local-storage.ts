export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

/** Migra datos de la versión anterior si existen */
export function migrateLegacyInventory(): unknown[] {
  if (typeof window === 'undefined') return [];

  const legacy = localStorage.getItem('costify_inventory');
  if (!legacy) return [];

  try {
    const parsed = JSON.parse(legacy) as Array<Record<string, unknown>>;
    return parsed.map((item) => ({
      ...item,
      productType: item.productType ?? 'simple',
      marginType: item.marginType ?? 'markup',
      totalIndirectPerUnit: item.totalIndirectPerUnit ?? item.totalUnitCost
        ? (item.totalUnitCost as number) - (item.unitCost as number)
        : 0,
      grossMarginPercent: item.grossMarginPercent ?? 0,
      indirectBreakdown: item.indirectBreakdown ?? [],
    }));
  } catch {
    return [];
  }
}

export function migrateLegacyGlobalCosts(): unknown[] {
  if (typeof window === 'undefined') return [];
  const legacy = localStorage.getItem('costify_global_costs');
  if (!legacy) return [];
  try {
    return JSON.parse(legacy);
  } catch {
    return [];
  }
}
