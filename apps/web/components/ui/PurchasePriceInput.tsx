'use client';

import { segmentClassName } from '@/lib/ui/field-styles';
import type { PurchasePriceMode } from '@/lib/ui/purchase-price';
import { switchPurchasePriceMode } from '@/lib/ui/purchase-price';
import type { PurchaseCurrency } from '@costify/shared/domain/types';
import type { ExchangeRateSnapshot } from '@costify/shared/domain/exchange-rates';
import { PURCHASE_CURRENCY_LABELS, toCup, TRMI_DISCLAIMER } from '@costify/shared/domain/exchange-rates';
import { formatCurrency } from '@costify/shared/format/currency';
import { cn } from '@/lib/utils';
import { NumericInput } from './NumericInput';

const MODE_OPTIONS: { id: PurchasePriceMode; label: string }[] = [
  { id: 'per-unit', label: 'Por unidad' },
  { id: 'per-package', label: 'Por lote' },
];

const CURRENCY_OPTIONS: PurchaseCurrency[] = ['CUP', 'USD', 'MLC', 'EUR'];

interface PurchasePriceInputProps {
  mode: PurchasePriceMode;
  onModeChange: (mode: PurchasePriceMode) => void;
  currency: PurchaseCurrency;
  onCurrencyChange: (currency: PurchaseCurrency) => void;
  exchangeRate: number;
  onExchangeRateChange: (rate: number) => void;
  suggestedTrmiRate?: number;
  value: number;
  onChange: (value: number) => void;
  packageQuantity: number;
  unitLabel: string;
  snapshot?: ExchangeRateSnapshot | null;
  exchangeRateError?: string;
  error?: string;
  perUnitHint?: string;
  perPackageHint?: string;
}

export function PurchasePriceInput({
  mode,
  onModeChange,
  currency,
  onCurrencyChange,
  exchangeRate,
  onExchangeRateChange,
  suggestedTrmiRate = 0,
  value,
  onChange,
  packageQuantity,
  unitLabel,
  snapshot,
  exchangeRateError,
  error,
  perUnitHint,
  perPackageHint,
}: PurchasePriceInputProps) {
  const currencyLabel = PURCHASE_CURRENCY_LABELS[currency];
  const label =
    mode === 'per-unit'
      ? `Precio de compra por ${unitLabel} (${currencyLabel})`
      : `Precio de compra del lote (${currencyLabel})`;

  const hint =
    mode === 'per-unit'
      ? (perUnitHint ?? `Costo por cada ${unitLabel}`)
      : (perPackageHint ?? 'Lo que pagaste por la compra completa');

  const handleModeChange = (nextMode: PurchasePriceMode) => {
    if (nextMode === mode) return;
    onModeChange(nextMode);
    onChange(switchPurchasePriceMode(value, mode, nextMode, packageQuantity));
  };

  const totalInCurrency =
    mode === 'per-package' ? value : value * (packageQuantity > 0 ? packageQuantity : 1);

  const effectiveRate = currency !== 'CUP' ? exchangeRate : 0;
  const cupEquivalent =
    currency !== 'CUP' && value > 0 && effectiveRate > 0
      ? toCup(totalInCurrency, currency, snapshot ?? null, effectiveRate)
      : null;

  const trmiDiffers =
    currency !== 'CUP' &&
    suggestedTrmiRate > 0 &&
    effectiveRate > 0 &&
    Math.abs(effectiveRate - suggestedTrmiRate) / suggestedTrmiRate >= 0.02;

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-0.5" role="group" aria-label="Moneda de compra">
        {CURRENCY_OPTIONS.map((c) => {
          const active = currency === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onCurrencyChange(c)}
              aria-pressed={active}
              className={cn(
                segmentClassName,
                'shrink-0 justify-center min-w-[3.5rem]',
                active
                  ? 'border-brand bg-brand-muted text-brand-foreground'
                  : 'border-border text-muted hover:text-foreground hover:bg-surface-muted'
              )}
            >
              {PURCHASE_CURRENCY_LABELS[c]}
            </button>
          );
        })}
      </div>

      {currency !== 'CUP' && (
        <div className="rounded-xl border border-border bg-surface-muted/50 px-3 py-3 space-y-2">
          <p className="text-xs text-muted leading-relaxed">{TRMI_DISCLAIMER}</p>

          <NumericInput
            label={`Tasa real que pagaste (CUP por 1 ${currencyLabel})`}
            value={exchangeRate}
            error={exchangeRateError}
            onChange={onExchangeRateChange}
            hint={
              suggestedTrmiRate > 0
                ? `Referencia TRMI hoy: ${formatCurrency(suggestedTrmiRate)} — ajústala a lo que pagaste`
                : 'Ingresa cuántos CUP pagaste por cada unidad de divisa'
            }
          />

          {suggestedTrmiRate > 0 && exchangeRate <= 0 && (
            <button
              type="button"
              onClick={() => onExchangeRateChange(suggestedTrmiRate)}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Usar referencia TRMI ({formatCurrency(suggestedTrmiRate)})
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2" role="group" aria-label="Modo de precio de compra">
        {MODE_OPTIONS.map(({ id, label: optionLabel }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleModeChange(id)}
              aria-pressed={active}
              className={cn(
                segmentClassName,
                'flex-1 justify-center',
                active
                  ? 'border-brand bg-brand-muted text-brand-foreground'
                  : 'border-border text-muted hover:text-foreground hover:bg-surface-muted'
              )}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>

      <NumericInput
        label={label}
        value={value}
        error={error}
        onChange={onChange}
        hint={hint}
      />

      {cupEquivalent != null && cupEquivalent > 0 && (
        <p className="text-sm text-muted">
          Costo en CUP:{' '}
          <strong className="text-foreground tabular-nums">{formatCurrency(cupEquivalent)}</strong>
          <span className="ml-1">
            (1 {currencyLabel} = {formatCurrency(effectiveRate)})
          </span>
          {trmiDiffers && suggestedTrmiRate > 0 && (
            <span className="block text-xs text-muted mt-0.5">
              Tu tasa difiere de la TRMI ({formatCurrency(suggestedTrmiRate)}) — correcto si pagaste
              otro precio en el mercado.
            </span>
          )}
          {snapshot?.stale && (
            <span className="block text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Referencia TRMI en cache — puede no estar actualizada
            </span>
          )}
        </p>
      )}
    </div>
  );
}
