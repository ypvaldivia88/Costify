'use client';

import { PiggyBank } from 'lucide-react';
import type { DistributionCriteria, GlobalFundSettings } from '@/lib/domain/types';
import { DISTRIBUTION_CRITERIA_LABELS } from '@/lib/domain/constants';
import { formatCurrency } from '@/lib/format/currency';
import { formatNumericInput, parseNumericInput } from '@/lib/format/numeric-input';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface GlobalFundSettingsProps {
  settings: GlobalFundSettings;
  onChange: (updates: Partial<GlobalFundSettings>) => void;
}

export function GlobalFundSettingsPanel({ settings, onChange }: GlobalFundSettingsProps) {
  return (
    <Card>
      <SectionHeader
        icon={PiggyBank}
        title="Fondo global opcional"
        description="Monto mensual que se distribuye automáticamente en todos los cálculos de productos"
      />

      <label className="flex items-start gap-3 cursor-pointer py-2 mb-4">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="mt-1 w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
        />
        <div>
          <p className="text-sm font-medium text-zinc-800">Activar fondo global</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Se aplica a todos los productos sin necesidad de importarlo en cada ficha.
          </p>
        </div>
      </label>

      {settings.enabled && (
        <div className="space-y-4 pt-2 border-t border-zinc-100">
          <Input
            label="Nombre del fondo"
            placeholder="Ej. Reserva operativa"
            value={settings.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />

          <Input
            label="Monto mensual (CUP)"
            type="number"
            inputMode="decimal"
            value={formatNumericInput(settings.amount)}
            onChange={(e) => onChange({ amount: parseNumericInput(e.target.value) })}
            hint="Importe total del período a repartir entre productos"
          />

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Criterio de distribución
            </label>
            <select
              value={settings.distributionCriteria}
              onChange={(e) =>
                onChange({ distributionCriteria: e.target.value as DistributionCriteria })
              }
              className="w-full min-h-11 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:border-emerald-500"
            >
              {Object.entries(DISTRIBUTION_CRITERIA_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {settings.distributionCriteria === 'manual' && (
            <Input
              label="Unidades para distribuir"
              type="number"
              inputMode="numeric"
              value={formatNumericInput(settings.distributionUnits ?? 0)}
              onChange={(e) =>
                onChange({ distributionUnits: parseNumericInput(e.target.value) })
              }
            />
          )}

          {settings.amount > 0 && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 px-4 py-3 text-sm text-emerald-800">
              El fondo de <strong>{formatCurrency(settings.amount)}</strong> se incluirá en cada
              cálculo según el criterio seleccionado.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
