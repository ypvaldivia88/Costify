import type { TaxLine, TaxSector, TaxSettings } from './types';

/** TCP — Res. 271/2024 MFP: IVSS 10% ingresos; 5% sobre excedente mensual (~3 270 CUP) */
export const TCP_MONTHLY_THRESHOLD_CUP = 3270;

const IVSS_LINE: TaxLine = {
  id: 'ivss',
  name: 'IVSS (ventas y servicios)',
  enabled: true,
  ratePercent: 10,
  base: 'revenue',
};

const TERRITORIAL_LINE: TaxLine = {
  id: 'territorial',
  name: 'Contribución territorial',
  enabled: true,
  ratePercent: 1,
  base: 'revenue',
};

const CONTINGENCY_LINE: TaxLine = {
  id: 'contingency',
  name: 'Reserva contingencias',
  enabled: false,
  ratePercent: 10,
  base: 'remainingProfit',
};

const PROFIT_TAX_LINE: TaxLine = {
  id: 'profit-tax',
  name: 'Impuesto sobre utilidades',
  enabled: false,
  ratePercent: 35,
  base: 'remainingProfit',
};

const TCP_PERSONAL_INCOME_LINE: TaxLine = {
  id: 'tcp-personal-income',
  name: 'Pago a cuenta (ingresos personales)',
  enabled: true,
  ratePercent: 5,
  base: 'revenueExcess',
  monthlyThresholdCup: TCP_MONTHLY_THRESHOLD_CUP,
};

export const TAX_SECTOR_LABELS: Record<TaxSector, string> = {
  none: 'Sin impuestos',
  tcp: 'TCP (cuenta propia)',
  mipyme: 'MIPYME',
  cna: 'CNA (cooperativa)',
  custom: 'Personalizado',
};

export const TAX_SECTOR_DESCRIPTIONS: Record<TaxSector, string> = {
  none: 'No incluir estimaciones tributarias en las proyecciones.',
  tcp: 'Trabajador por cuenta propia. IVSS 10% y 5% sobre ingresos que excedan el umbral mensual (Res. 271/2024).',
  mipyme: 'Micro, pequeña y mediana empresa. IVSS, contribución territorial y utilidades (Res. 306/2023).',
  cna: 'Cooperativa no agropecuaria. Mismo esquema general que MIPYME en la práctica tributaria.',
  custom: 'Define tus propias líneas de impuesto con tasas y bases editables.',
};

export const TAX_LINE_BASE_LABELS: Record<TaxLine['base'], string> = {
  revenue: '% sobre ingresos',
  revenueExcess: '% sobre ingresos que excedan umbral',
  remainingProfit: '% sobre utilidad restante',
};

function cloneLines(lines: TaxLine[]): TaxLine[] {
  return lines.map((line) => ({ ...line }));
}

export const TAX_PRESETS: Record<Exclude<TaxSector, 'custom'>, TaxLine[]> = {
  none: [],
  tcp: cloneLines([IVSS_LINE, TCP_PERSONAL_INCOME_LINE]),
  mipyme: cloneLines([IVSS_LINE, TERRITORIAL_LINE, CONTINGENCY_LINE, PROFIT_TAX_LINE]),
  cna: cloneLines([IVSS_LINE, TERRITORIAL_LINE, CONTINGENCY_LINE, PROFIT_TAX_LINE]),
};

export function getPresetLines(sector: TaxSector): TaxLine[] {
  if (sector === 'custom') {
    return cloneLines(TAX_PRESETS.mipyme);
  }
  return cloneLines(TAX_PRESETS[sector]);
}

export function createTaxSettingsForSector(
  sector: TaxSector,
  previous?: TaxSettings
): TaxSettings {
  if (sector === 'custom' && previous?.sector === 'custom') {
    return { ...previous, sector: 'custom' };
  }
  return {
    enabled: sector !== 'none',
    sector,
    lines: getPresetLines(sector),
  };
}
