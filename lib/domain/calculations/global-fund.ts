import type { GlobalFundSettings, IndirectCost } from '../types';

export const GLOBAL_FUND_ID = 'costify-global-fund';

export function applyGlobalFund(
  indirectCosts: IndirectCost[],
  globalFund?: GlobalFundSettings
): IndirectCost[] {
  const withoutFund = indirectCosts.filter((cost) => cost.id !== GLOBAL_FUND_ID);

  if (!globalFund?.enabled || globalFund.amount <= 0) {
    return withoutFund;
  }

  const fundEntry: IndirectCost = {
    id: GLOBAL_FUND_ID,
    name: globalFund.name.trim() || 'Fondo global',
    amount: globalFund.amount,
    distributionCriteria: globalFund.distributionCriteria,
    distributionUnits:
      globalFund.distributionCriteria === 'manual' ? globalFund.distributionUnits : undefined,
  };

  return [fundEntry, ...withoutFund];
}
