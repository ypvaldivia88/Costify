'use client';

import { Receipt } from 'lucide-react';
import type { TaxSettings } from '@/lib/domain/types';
import { CUBAN_MIPYME_TAX_RATES } from '@/lib/domain/constants';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface TaxSettingsPanelProps {
  settings: TaxSettings;
  onChange: (updates: Partial<TaxSettings>) => void;
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
      />
      <div>
        <p className="text-sm font-medium text-zinc-800">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
    </label>
  );
}

export function TaxSettingsPanel({ settings, onChange }: TaxSettingsPanelProps) {
  return (
    <Card>
      <SectionHeader
        icon={Receipt}
        title="Impuestos MIPYME (Cuba)"
        description="Estimaciones según Resolución 306/2023 del MFP"
      />

      <div className="divide-y divide-zinc-100">
        <Toggle
          label={`Impuesto sobre Ventas y Servicios (${CUBAN_MIPYME_TAX_RATES.salesTax * 100}%)`}
          description="Aplicado sobre los ingresos mensuales por ventas."
          checked={settings.includeSalesTax}
          onChange={(v) => onChange({ includeSalesTax: v })}
        />
        <Toggle
          label={`Contribución Territorial (${CUBAN_MIPYME_TAX_RATES.territorialContribution * 100}%)`}
          description="Sobre ingresos totales del desarrollo de la actividad."
          checked={settings.includeTerritorialContribution}
          onChange={(v) => onChange({ includeTerritorialContribution: v })}
        />
        <Toggle
          label={`Impuesto sobre Utilidades (${CUBAN_MIPYME_TAX_RATES.profitTax * 100}%)`}
          description="Incluye reserva para pérdidas y contingencias antes del cálculo."
          checked={settings.includeProfitTaxEstimate}
          onChange={(v) => onChange({ includeProfitTaxEstimate: v })}
        />
      </div>

      {settings.includeProfitTaxEstimate && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <label className="text-sm font-medium text-zinc-700">
            Reserva para contingencias: {settings.contingencyReservePercent}%
          </label>
          <input
            type="range"
            min="2"
            max="10"
            step="1"
            value={settings.contingencyReservePercent}
            onChange={(e) =>
              onChange({ contingencyReservePercent: Number(e.target.value) })
            }
            className="w-full h-2 mt-2 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-emerald-600"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Mínimo 2% y máximo 10% de gastos totales según normativa MIPYME.
          </p>
        </div>
      )}

      <p className="text-xs text-zinc-400 mt-4 leading-relaxed">
        Estas estimaciones son orientativas para fijar precios. Consulta con tu contador para
        declaraciones oficiales.
      </p>
    </Card>
  );
}
