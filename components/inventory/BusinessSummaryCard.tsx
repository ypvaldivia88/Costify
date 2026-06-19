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
      <div className="grid grid-cols-2 gap-4">
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
        <div className="mt-4 pt-4 border-t border-emerald-200/60 space-y-1.5 text-sm">
          {summary.taxLineTotals.map((line) => (
            <div key={line.id} className="flex justify-between text-brand-foreground/80">
              <span>{line.name}</span>
              <span>-{formatCurrency(line.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-foreground pt-1">
            <span>Utilidad neta estimada</span>
            <span>{formatCurrency(summary.totalNetProfit)}</span>
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
