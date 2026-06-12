import type { GlobalFundSettings } from '../types';

export function migrateGlobalFundSettings(
  stored: Partial<GlobalFundSettings> & { amount?: number }
): GlobalFundSettings {
  return {
    enabled: stored.enabled ?? false,
    name: stored.name?.trim() || 'Fondo global',
    percent: stored.percent ?? 0,
  };
}

/** Porcentaje del costo directo unitario reservado para el fondo global */
export function calculateGlobalFundPerUnit(
  unitDirectCost: number,
  globalFund?: GlobalFundSettings
): number {
  if (!globalFund?.enabled || globalFund.percent <= 0 || unitDirectCost <= 0) {
    return 0;
  }
  return unitDirectCost * (globalFund.percent / 100);
}
