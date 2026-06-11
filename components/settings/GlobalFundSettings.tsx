'use client';

import { PiggyBank } from 'lucide-react';
import type { DistributionCriteria, GlobalFundSettings } from '@/lib/domain/types';
import { DISTRIBUTION_CRITERIA_LABELS } from '@/lib/domain/constants';
import { formatCurrency } from '@/lib/format/currency';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/NumericInput';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';

interface GlobalFundSettingsProps {
  settings: GlobalFundSettings;
  onChange: (updates: Partial<GlobalFundSettings>) => void;
}

const selectClass = cn(
  'w-full min-h-11 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground',
  'focus:outline-none focus:border-brand'
);

export function GlobalFundSettingsPanel({ settings, onChange }: GlobalFundSettingsProps) {
  return (
    <Card>
      <SectionHeader
        icon={PiggyBank}
        title="Fondo global opcional"
        description="Monto mensual repartido automáticamente en todos los productos"
      />

      <label className="flex items-start gap-3 cursor-pointer py-2 mb-4">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="mt-1 w-5 h-5 rounded border-border text-brand focus:ring-brand"
        />
        <div>
          <p className="text-sm font-medium text-foreground">Activar fondo global</p>
          <p className="text-xs text-muted mt-0.5">
            Se aplica a todos los productos sin importarlo en cada ficha.
          </p>
        </div>
      </label>

      {settings.enabled && (
        <div className="space-y-4 pt-2 border-t border-border">
          <Input
            label="Nombre del fondo"
            placeholder="Ej. Reserva operativa"
            value={settings.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />

          <NumericInput
            label="Monto mensual (CUP)"
            value={settings.amount}
            onChange={(amount) => onChange({ amount })}
            hint="Importe total del período a repartir"
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Criterio de distribución
            </label>
            <select
              value={settings.distributionCriteria}
              onChange={(e) =>
                onChange({ distributionCriteria: e.target.value as DistributionCriteria })
              }
              className={selectClass}
            >
              {Object.entries(DISTRIBUTION_CRITERIA_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {settings.distributionCriteria === 'manual' && (
            <NumericInput
              label="Unidades para distribuir"
              value={settings.distributionUnits ?? 0}
              onChange={(distributionUnits) => onChange({ distributionUnits })}
            />
          )}

          {settings.amount > 0 && (
            <div className="rounded-xl bg-accent-surface border border-accent-border px-4 py-3 text-sm text-brand-foreground">
              El fondo de <strong>{formatCurrency(settings.amount)}</strong> se incluirá en cada
              cálculo según el criterio seleccionado.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
