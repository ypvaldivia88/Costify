import { calculateSuggestedPriceWithLaborShare } from './calculations/pricing';
import type { ProductCalculation, PurchaseCurrency, RawMaterial } from './types';

/** Monedas soportadas por la API TRMI de elTOQUE */
export type TrmiCurrencyKey = 'USD' | 'ECU' | 'MLC' | 'USDT_TRC20' | 'BTC' | 'TRX';

export interface TrmiApiResponse {
  tasas: Partial<Record<TrmiCurrencyKey, number>>;
  date: string;
  hour: number;
  minutes: number;
  seconds: number;
}

export interface TrmiRates {
  USD: number;
  EUR: number;
  MLC: number;
}

export interface ExchangeRateSnapshot {
  rates: TrmiRates;
  date: string;
  hour: number;
  minutes: number;
  seconds: number;
  fetchedAt: number;
  /** true si se usó cache local por falta de red */
  stale?: boolean;
}

export interface ExchangeRateSettings {
  /** Moneda secundaria para equivalencias en toda la app */
  displayCurrency: Exclude<PurchaseCurrency, 'CUP'>;
  /** Último snapshot conocido (cache local / servidor) */
  lastSnapshot: ExchangeRateSnapshot | null;
  /** Umbral % de variación del USD para alertas de revisión de precios */
  alertThresholdPercent: number;
  /** Tasa USD al último costeo registrado (referencia para alertas) */
  lastCostingRateUsd?: number;
  lastCostingAt?: number;
}

export interface MarginSensitivityRow {
  label: string;
  rateMultiplier: number;
  usdRate: number;
  unitCost: number;
  suggestedPrice: number;
  marginPercent: number;
}

export interface PriceReviewAlertTarget {
  refType: 'raw_material' | 'product';
  refId: string;
  name: string;
}

export interface PriceReviewAlert {
  id: string;
  message: string;
  severity: 'warning' | 'info';
  affectedCount: number;
  target?: PriceReviewAlertTarget;
  actionLabel?: string;
}

export const PURCHASE_CURRENCY_LABELS: Record<PurchaseCurrency, string> = {
  CUP: 'CUP',
  USD: 'USD',
  EUR: 'EUR',
  MLC: 'MLC',
};

export const TRMI_DISCLAIMER =
  'La TRMI de elTOQUE es una media calculada por algoritmo. El precio real de compra y venta de divisas varía alrededor de esa referencia — indica la tasa que pagaste o recibiste en cada operación.';

export const DEFAULT_EXCHANGE_RATE_SETTINGS: ExchangeRateSettings = {
  displayCurrency: 'USD',
  lastSnapshot: null,
  alertThresholdPercent: 5,
};

const TRMI_TO_PURCHASE: Record<Exclude<PurchaseCurrency, 'CUP'>, keyof TrmiRates> = {
  USD: 'USD',
  EUR: 'EUR',
  MLC: 'MLC',
};

export function mapTrmiResponse(data: TrmiApiResponse, fetchedAt = Date.now()): ExchangeRateSnapshot {
  const tasas = data.tasas;
  return {
    rates: {
      USD: tasas.USD ?? 0,
      EUR: tasas.ECU ?? tasas.USD ?? 0,
      MLC: tasas.MLC ?? 0,
    },
    date: data.date,
    hour: data.hour,
    minutes: data.minutes,
    seconds: data.seconds,
    fetchedAt,
  };
}

export function getRateForCurrency(
  snapshot: ExchangeRateSnapshot | null,
  currency: PurchaseCurrency
): number | null {
  if (!snapshot || currency === 'CUP') return currency === 'CUP' ? 1 : null;
  const rate = snapshot.rates[TRMI_TO_PURCHASE[currency]];
  return rate > 0 ? rate : null;
}

export function toCupWithRate(amount: number, rate: number): number {
  return amount * rate;
}

export function toCup(
  amount: number,
  currency: PurchaseCurrency,
  snapshot: ExchangeRateSnapshot | null,
  customRate?: number
): number {
  if (currency === 'CUP') return amount;
  const rate = customRate ?? getRateForCurrency(snapshot, currency);
  if (!rate) return amount;
  return toCupWithRate(amount, rate);
}

export function fromCup(
  cup: number,
  currency: Exclude<PurchaseCurrency, 'CUP'>,
  snapshot: ExchangeRateSnapshot | null
): number | null {
  const rate = getRateForCurrency(snapshot, currency);
  if (!rate) return null;
  return cup / rate;
}

export function formatSnapshotTime(snapshot: ExchangeRateSnapshot): string {
  const h = String(snapshot.hour).padStart(2, '0');
  const m = String(snapshot.minutes).padStart(2, '0');
  return `${snapshot.date} ${h}:${m}`;
}

export function formatForeignAmount(
  amount: number,
  currency: Exclude<PurchaseCurrency, 'CUP'>,
  decimals = 2
): string {
  return `${amount.toFixed(decimals)} ${PURCHASE_CURRENCY_LABELS[currency]}`;
}

export function getForeignCostRatio(
  product: ProductCalculation,
  materials: RawMaterial[]
): number {
  if (product.productType === 'simple' && product.purchaseMeta) {
    return 1;
  }

  if (!product.recipeBreakdown?.length) return product.purchaseMeta ? 1 : 0;

  const materialMap = new Map(materials.map((m) => [m.id, m]));
  let foreignCost = 0;

  for (const line of product.recipeBreakdown) {
    const material = materialMap.get(line.rawMaterialId);
    if (material?.purchaseMeta) {
      foreignCost += line.lineCost;
    }
  }

  return product.unitCost > 0 ? Math.min(1, foreignCost / product.unitCost) : 0;
}

export function calculateMarginSensitivity(
  product: ProductCalculation,
  materials: RawMaterial[],
  snapshot: ExchangeRateSnapshot | null,
  multipliers: number[] = [0.9, 1, 1.1, 1.2]
): MarginSensitivityRow[] {
  if (!snapshot?.rates.USD) return [];

  const baseRate = snapshot.rates.USD;
  const foreignRatio = getForeignCostRatio(product, materials);
  if (foreignRatio <= 0) return [];

  const directCost = product.unitCost;
  const indirectPerUnit = product.totalIndirectPerUnit;
  const margin = product.profitMargin;
  const marginType = product.marginType;

  return multipliers.map((multiplier) => {
    const usdRate = baseRate * multiplier;
    const adjustedDirect =
      directCost * (1 + foreignRatio * (multiplier - 1));
    const unitCost = adjustedDirect + indirectPerUnit;

    const laborPercent = product.totalLaborSharePercent ?? 0;
    let suggestedPrice: number;
    if (laborPercent > 0) {
      suggestedPrice = calculateSuggestedPriceWithLaborShare(
        unitCost,
        margin,
        marginType,
        laborPercent
      );
    } else if (marginType === 'markup') {
      suggestedPrice = unitCost * (1 + margin / 100);
    } else {
      suggestedPrice = margin >= 100 ? unitCost : unitCost / (1 - margin / 100);
    }

    const laborPerUnit = laborPercent > 0 ? suggestedPrice * (laborPercent / 100) : 0;
    const profitPerUnit = suggestedPrice - unitCost - laborPerUnit;
    const marginPercent =
      suggestedPrice > 0 ? (profitPerUnit / suggestedPrice) * 100 : 0;

    const label =
      multiplier === 1
        ? 'Actual'
        : multiplier > 1
          ? `USD +${Math.round((multiplier - 1) * 100)}%`
          : `USD ${Math.round((multiplier - 1) * 100)}%`;

    return {
      label,
      rateMultiplier: multiplier,
      usdRate,
      unitCost,
      suggestedPrice,
      marginPercent,
    };
  });
}

function itemHasForeignPurchase(
  item: RawMaterial | ProductCalculation,
  currentUsd: number,
  threshold: number
): boolean {
  const meta = item.purchaseMeta;
  if (!meta) return false;
  const reference = meta.trmiReferenceRate ?? meta.exchangeRateUsed;
  if (reference <= 0) return false;
  const diff = Math.abs(currentUsd - reference) / reference;
  return diff >= threshold;
}

function buildForeignPurchaseAlert(
  item: RawMaterial | ProductCalculation,
  refType: PriceReviewAlertTarget['refType'],
  currentUsd: number
): PriceReviewAlert {
  const meta = item.purchaseMeta!;
  const reference = meta.trmiReferenceRate ?? meta.exchangeRateUsed;
  const pct = ((Math.abs(currentUsd - reference) / reference) * 100).toFixed(1);
  const currencyLabel = PURCHASE_CURRENCY_LABELS[meta.originalCurrency];

  return {
    id: `foreign-purchase:${refType}:${item.id}`,
    message: `${item.name}: compra en ${currencyLabel} a ${reference.toFixed(0)} CUP; la TRMI hoy está en ${currentUsd.toFixed(0)} CUP (±${pct}%).`,
    severity: 'info',
    affectedCount: 1,
    target: { refType, refId: item.id, name: item.name },
    actionLabel: refType === 'raw_material' ? 'Ver insumo' : 'Ver producto',
  };
}

export function getPriceReviewAlerts(
  materials: RawMaterial[],
  products: ProductCalculation[],
  snapshot: ExchangeRateSnapshot | null,
  settings: ExchangeRateSettings
): PriceReviewAlert[] {
  const alerts: PriceReviewAlert[] = [];
  if (!snapshot?.rates.USD) return alerts;

  const currentUsd = snapshot.rates.USD;
  const threshold = settings.alertThresholdPercent / 100;

  if (settings.lastCostingRateUsd && settings.lastCostingRateUsd > 0) {
    const change = Math.abs(currentUsd - settings.lastCostingRateUsd) / settings.lastCostingRateUsd;
    if (change >= threshold) {
      const direction = currentUsd > settings.lastCostingRateUsd ? 'subió' : 'bajó';
      const pct = (change * 100).toFixed(1);
      alerts.push({
        id: 'global-rate-change',
        message: `La referencia TRMI del USD ${direction} ${pct}% (${settings.lastCostingRateUsd.toFixed(0)} → ${currentUsd.toFixed(0)} CUP). El mercado informal varía alrededor de esa media — revisa si conviene actualizar tus costos.`,
        severity: 'warning',
        affectedCount: materials.length + products.length,
      });
    }
  }

  for (const material of materials) {
    if (itemHasForeignPurchase(material, currentUsd, threshold)) {
      alerts.push(buildForeignPurchaseAlert(material, 'raw_material', currentUsd));
    }
  }

  for (const product of products) {
    if (itemHasForeignPurchase(product, currentUsd, threshold)) {
      alerts.push(buildForeignPurchaseAlert(product, 'product', currentUsd));
    }
  }

  return alerts;
}

export function buildPurchaseMeta(
  originalAmount: number,
  currency: Exclude<PurchaseCurrency, 'CUP'>,
  exchangeRateUsed: number,
  snapshot: ExchangeRateSnapshot | null
) {
  const trmiReferenceRate = snapshot ? getRateForCurrency(snapshot, currency) ?? undefined : undefined;
  return {
    originalCurrency: currency,
    originalAmount,
    exchangeRateUsed,
    trmiReferenceRate,
    rateDate: snapshot?.date ?? new Date().toISOString().slice(0, 10),
    rateFetchedAt: snapshot?.fetchedAt ?? Date.now(),
  };
}
