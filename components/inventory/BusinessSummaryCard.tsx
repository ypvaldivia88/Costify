'use client';

import type { BusinessSummary, TaxSettings } from '@/lib/domain/types';
import { hasActiveTaxes } from '@/lib/domain/calculations/taxes';
import { formatCurrency, formatPercent } from '@/lib/format/currency';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';

interface BusinessSummaryCardProps {
  summary: BusinessSummary;
  taxSettings: TaxSettings;
}

export function BusinessSummaryCard({ summary, taxSettings }: BusinessSummaryCardProps) {
  const showTaxes = hasActiveTaxes(taxSettings) && summary.taxLineTotals.length > 0;

  return (
    <Card variant="accent">
      <p className="text-xs font-bold uppercase tracking-wide text-brand mb-4">
        Resumen mensual del negocio
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <StatCard label="Ingresos proyectados" value={formatCurrency(summary.totalRevenue)} />
        <StatCard
          label="Utilidad bruta"
          value={formatCurrency(summary.totalGrossProfit)}
          variant="accent"
        />
        <StatCard
          label="Gastos indirectos"
          value={formatCurrency(summary.totalIndirectCost)}
          variant="warning"
        />
        <StatCard
          label="Margen promedio"
          value={formatPercent(summary.averageGrossMargin)}
        />
      </div>

      {showTaxes && (
        <div className="mt-4 pt-4 border-t border-emerald-200/60 space-y-1.5">
          {summary.taxLineTotals.map((line) => (
            <div
              key={line.id}
              className="flex items-baseline justify-between gap-3 text-brand-foreground/80"
            >
              <span className="min-w-0 flex-1 leading-snug">{line.name}</span>
              <span className="summary-row-value shrink-0 tabular-nums whitespace-nowrap text-right">
                -{formatCurrency(line.amount)}
              </span>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-3 font-bold text-foreground pt-1">
            <span className="min-w-0 flex-1 leading-snug">Utilidad neta estimada</span>
            <span className="summary-row-value shrink-0 tabular-nums whitespace-nowrap text-right">
              {formatCurrency(summary.totalNetProfit)}
            </span>
          </div>
        </div>
      )}

      <p className="text-[11px] text-brand/70 mt-3">
        {summary.productCount > 0 && summary.totalRevenue === 0
          ? 'Indica unidades/mes en cada producto para ver proyecciones mensuales.'
          : 'Basado en las unidades de venta configuradas por producto.'}
      </p>
    </Card>
  );
}
