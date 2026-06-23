'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight, RefreshCw, Settings2, TrendingUp } from 'lucide-react';
import type { PurchaseCurrency } from '@/lib/domain/types';
import {
  formatSnapshotTime,
  fromCup,
  PURCHASE_CURRENCY_LABELS,
  toCup,
  TRMI_DISCLAIMER,
} from '@/lib/domain/exchange-rates';
import { useExchangeRatesContext } from '@/hooks/use-exchange-rates-context';
import { TCP_MONTHLY_THRESHOLD_CUP } from '@/lib/domain/tax-presets';
import { formatCurrency } from '@/lib/format/currency';
import { Card } from '@/components/ui/Card';
import { NumericField } from '@/components/ui/NumericField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';

const DISPLAY_CURRENCIES: Exclude<PurchaseCurrency, 'CUP'>[] = ['USD', 'MLC', 'EUR'];

export function ExchangeRatesPanel() {
  const {
    snapshot,
    settings,
    refreshing,
    error,
    refreshRates,
    updateSettings,
  } = useExchangeRatesContext();

  const [calcAmount, setCalcAmount] = useState(1);
  const [calcFrom, setCalcFrom] = useState<PurchaseCurrency>('USD');
  const [calcTo, setCalcTo] = useState<PurchaseCurrency>('CUP');

  const rates = snapshot?.rates;

  const calcResult = useMemo(() => {
    if (!snapshot || calcAmount <= 0) return null;

    if (calcFrom === calcTo) return calcAmount;

    const cupValue = toCup(calcAmount, calcFrom, snapshot);
    if (calcTo === 'CUP') return cupValue;

    const target = fromCup(cupValue, calcTo, snapshot);
    return target;
  }, [snapshot, calcAmount, calcFrom, calcTo]);

  const tcpThresholdForeign = useMemo(() => {
    if (!snapshot) return null;
    return fromCup(TCP_MONTHLY_THRESHOLD_CUP, settings.displayCurrency, snapshot);
  }, [snapshot, settings.displayCurrency]);

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader
          icon={TrendingUp}
          title="Tasas de cambio (TRMI)"
          description="Referencia del mercado informal — media calculada por elTOQUE, no el precio exacto de cada operación"
        />

        <p className="text-sm text-muted leading-relaxed mb-4">{TRMI_DISCLAIMER}</p>

        <div className="space-y-4">
          {rates ? (
            <div className="grid grid-cols-3 gap-3">
              {DISPLAY_CURRENCIES.map((currency) => (
                <div
                  key={currency}
                  className="rounded-xl border border-border bg-surface-muted/60 px-3 py-3 text-center"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    1 {currency}
                  </p>
                  <p className="text-lg font-black text-brand tabular-nums mt-1">
                    {formatCurrency(rates[currency])}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              No hay tasas cargadas. Pulsa actualizar para obtener los valores actuales.
            </p>
          )}

          {snapshot && (
            <p className="text-xs text-muted">
              Actualizado: {formatSnapshotTime(snapshot)}
              {snapshot.stale && (
                <span className="text-amber-600 dark:text-amber-400 ml-1">(cache local)</span>
              )}
            </p>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Button
            type="button"
            variant="outline"
            onClick={() => void refreshRates(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando…' : 'Actualizar tasas'}
          </Button>

          <p className="text-xs text-muted leading-relaxed">
            Fuente:{' '}
            <a
              href="https://eltoque.com/tasas-de-cambio-cuba/mercado-informal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              elTOQUE — Mercado Informal
            </a>
            . La TRMI es una media de referencia; al registrar compras en divisa debes indicar la tasa
            real que pagaste.
          </p>
        </div>
      </Card>

      <Card>
        <SectionHeader
          icon={ArrowLeftRight}
          title="Calculadora de divisas"
          description="Convierte entre CUP, USD, MLC y EUR con la TRMI actual"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Cantidad</label>
            <NumericField value={calcAmount} onChange={setCalcAmount} className="w-full min-h-11 px-3" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">De</label>
            <select
              value={calcFrom}
              onChange={(e) => setCalcFrom(e.target.value as PurchaseCurrency)}
              className="w-full min-h-11 px-3 rounded-xl border border-border bg-surface text-sm"
            >
              {(['CUP', 'USD', 'MLC', 'EUR'] as PurchaseCurrency[]).map((c) => (
                <option key={c} value={c}>
                  {PURCHASE_CURRENCY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-sm font-medium text-foreground">A</label>
            <select
              value={calcTo}
              onChange={(e) => setCalcTo(e.target.value as PurchaseCurrency)}
              className="w-full min-h-11 px-3 rounded-xl border border-border bg-surface text-sm"
            >
              {(['CUP', 'USD', 'MLC', 'EUR'] as PurchaseCurrency[]).map((c) => (
                <option key={c} value={c}>
                  {PURCHASE_CURRENCY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {calcResult != null && (
          <div className="mt-4 rounded-xl bg-brand-muted border border-brand/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Resultado</p>
            <p className="text-2xl font-black text-brand tabular-nums mt-1">
              {calcTo === 'CUP'
                ? formatCurrency(calcResult)
                : `${calcResult.toFixed(4)} ${PURCHASE_CURRENCY_LABELS[calcTo]}`}
            </p>
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader
          icon={Settings2}
          title="Preferencias"
          description="Cómo se muestran las equivalencias en productos e inventario"
        />

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Moneda secundaria en la app
            </label>
            <select
              value={settings.displayCurrency}
              onChange={(e) =>
                updateSettings({
                  displayCurrency: e.target.value as Exclude<PurchaseCurrency, 'CUP'>,
                })
              }
              className="w-full min-h-11 px-3 rounded-xl border border-border bg-surface text-sm"
            >
              {DISPLAY_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {PURCHASE_CURRENCY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Umbral de alerta de revisión (%)
            </label>
            <NumericField
              value={settings.alertThresholdPercent}
              onChange={(alertThresholdPercent) =>
                updateSettings({ alertThresholdPercent: Math.max(1, alertThresholdPercent) })
              }
              className="w-full min-h-11 px-3"
            />
            <p className="text-xs text-muted">
              Aviso cuando el USD varíe más de este porcentaje respecto a tus últimos costeos.
            </p>
          </div>

          {tcpThresholdForeign != null && (
            <div className="rounded-xl bg-surface-muted border border-border px-4 py-3 text-sm">
              <p className="font-medium text-foreground">Referencia TCP</p>
              <p className="text-muted mt-1">
                Umbral mensual exento (~{formatCurrency(TCP_MONTHLY_THRESHOLD_CUP)}) ≈{' '}
                <strong className="text-foreground tabular-nums">
                  {tcpThresholdForeign.toFixed(2)} {PURCHASE_CURRENCY_LABELS[settings.displayCurrency]}
                </strong>{' '}
                al tipo actual
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
