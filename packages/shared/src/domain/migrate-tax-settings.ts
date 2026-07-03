import type { TaxLine, TaxSettings } from './types';
import { getPresetLines } from './tax-presets';

interface LegacyTaxSettings {
  includeSalesTax?: boolean;
  includeTerritorialContribution?: boolean;
  includeProfitTaxEstimate?: boolean;
  contingencyReservePercent?: number;
}

function isNewTaxSettings(value: unknown): value is TaxSettings {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sector' in value &&
    'lines' in value &&
    Array.isArray((value as TaxSettings).lines)
  );
}

function applyLegacyFlags(lines: TaxLine[], legacy: LegacyTaxSettings): TaxLine[] {
  return lines.map((line) => {
    switch (line.id) {
      case 'ivss':
        return { ...line, enabled: legacy.includeSalesTax ?? line.enabled };
      case 'territorial':
        return { ...line, enabled: legacy.includeTerritorialContribution ?? line.enabled };
      case 'contingency':
        return {
          ...line,
          enabled: legacy.includeProfitTaxEstimate ?? line.enabled,
          ratePercent: legacy.contingencyReservePercent ?? line.ratePercent,
        };
      case 'profit-tax':
        return { ...line, enabled: legacy.includeProfitTaxEstimate ?? line.enabled };
      default:
        return line;
    }
  });
}

export function migrateTaxSettings(stored: unknown): TaxSettings {
  if (isNewTaxSettings(stored)) {
    return {
      enabled: stored.enabled ?? stored.sector !== 'none',
      sector: stored.sector,
      lines: stored.lines.map((line) => ({ ...line })),
    };
  }

  const legacy = (stored ?? {}) as LegacyTaxSettings;
  const lines = applyLegacyFlags(getPresetLines('mipyme'), legacy);

  return {
    enabled: lines.some((line) => line.enabled),
    sector: 'mipyme',
    lines,
  };
}
