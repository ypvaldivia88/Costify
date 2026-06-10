'use client';

import type { BusinessSummary, TaxSettings } from '@/lib/domain/types';
import { formatCurrency, formatPercent } from '@/lib/format/currency';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';

interface BusinessSummaryCardProps {
  summary: BusinessSummary;
  taxSettings: TaxSettings;
}

export function BusinessSummaryCard({ summary, taxSettings }: BusinessSummaryCardProps) {
  const showTaxes =
    taxSettings.includeSalesTax ||
    taxSettings.includeTerritorialContribution ||
    taxSettings.includeProfitTaxEstimate;

  return (
    <Card variant="accent">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-4">
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
          {taxSettings.includeSalesTax && (
            <div className="flex justify-between text-emerald-800/80">
              <span>IVSS (10% ingresos)</span>
              <span>-{formatCurrency(summary.totalSalesTax)}</span>
            </div>
          )}
          {taxSettings.includeTerritorialContribution && (
            <div className="flex justify-between text-emerald-800/80">
              <span>Contrib. territorial (1%)</span>
              <span>-{formatCurrency(summary.totalTerritorialContribution)}</span>
            </div>
          )}
          {taxSettings.includeProfitTaxEstimate && (
            <>
              <div className="flex justify-between text-emerald-800/80">
                <span>Reserva contingencias</span>
                <span>-{formatCurrency(summary.totalContingencyReserve)}</span>
              </div>
              <div className="flex justify-between text-emerald-800/80">
                <span>Imp. utilidades (35%)</span>
                <span>-{formatCurrency(summary.totalEstimatedProfitTax)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold text-emerald-900 pt-1">
            <span>Utilidad neta estimada</span>
            <span>{formatCurrency(summary.totalNetProfit)}</span>
          </div>
        </div>
      )}

      <p className="text-[11px] text-emerald-700/70 mt-3">
        Basado en las unidades de venta configuradas por producto.
      </p>
    </Card>
  );
}
