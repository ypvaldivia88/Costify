import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadFromStorage<T>(key: string, fallback: T): Promise<T> {
  try {
    const saved = await AsyncStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

export async function saveToStorage<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function migrateLegacyInventory(): Promise<unknown[]> {
  const legacy = await AsyncStorage.getItem('costify_inventory');
  if (!legacy) return [];

  try {
    const parsed = JSON.parse(legacy) as Array<Record<string, unknown>>;
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

export async function migrateLegacyGlobalCosts(): Promise<unknown[]> {
  const legacy = await AsyncStorage.getItem('costify_global_costs');
  if (!legacy) return [];
  try {
    return JSON.parse(legacy);
  } catch {
    return [];
  }
}
