'use client';

import { TrendingUp } from 'lucide-react';
import type { MarginType, ProductCalculation, TaxSettings } from '@/lib/domain/types';
import {
  getIndirectCoverage,
  getTotalMonthlyIndirectCosts,
} from '@/lib/domain/calculations';
import { calculateMonthlyTaxProjection } from '@/lib/domain/calculations/taxes';
import { DISTRIBUTION_CRITERIA_SHORT, MARGIN_TYPE_LABELS } from '@/lib/domain/constants';
import { formatCurrency, formatPercent } from '@/lib/format/currency';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';

interface PricingResultsProps {
  result: ProductCalculation;
  inventoryCount: number;
  taxSettings: TaxSettings;
}

export function PricingResults({ result, inventoryCount, taxSettings }: PricingResultsProps) {
  const totalMonthlyIndirect = getTotalMonthlyIndirectCosts(result.indirectCosts);
  const coverage = getIndirectCoverage(
    result.totalIndirectPerUnit,
    result.productionUnits,
    totalMonthlyIndirect
  );

  const monthlyRevenue = result.suggestedPrice * result.productionUnits;
  const monthlyGrossProfit = result.profitPerUnit * result.productionUnits;
  const taxes = calculateMonthlyTaxProjection(monthlyRevenue, monthlyGrossProfit, taxSettings);

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={TrendingUp}
        title="Resultado del cálculo"
        description="Precio sugerido según costos y margen configurado"
      />

      <Card variant="accent" className="text-center">
        <p className="text-sm font-medium text-emerald-800 mb-1">Precio de venta sugerido</p>
        <p className="text-4xl sm:text-5xl font-black text-emerald-900 tabular-nums">
          {formatCurrency(result.suggestedPrice)}
        </p>
        <p className="text-sm text-emerald-700 mt-2">
          Utilidad por unidad: <strong>{formatCurrency(result.profitPerUnit)}</strong>
        </p>
        <p className="text-xs text-emerald-600 mt-1">
          Margen bruto real: {formatPercent(result.grossMarginPercent)}
        </p>
      </Card>

      {result.recipeBreakdown && result.recipeBreakdown.length > 0 && (
        <Card variant="muted">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
            Desglose de materias primas
          </p>
          <div className="space-y-1.5">
            {result.recipeBreakdown.map((item) => (
              <div key={item.rawMaterialId} className="flex justify-between text-sm gap-2">
                <span className="text-zinc-600 truncate">
                  {item.name}
                  <span className="text-zinc-400 text-xs ml-1">
                    ({item.quantity} × {formatCurrency(item.unitCost)})
                  </span>
                </span>
                <span className="font-semibold text-zinc-800 tabular-nums shrink-0">
                  {formatCurrency(item.lineCost)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-3">
          <StatCard label="Costo directo" value={formatCurrency(result.unitCost)} />
        </Card>
        <Card className="!p-3">
          <StatCard
            label="Gastos indirectos"
            value={formatCurrency(result.totalIndirectPerUnit)}
          />
        </Card>
        <Card className="!p-3 col-span-2">
          <StatCard
            label="Costo total unitario"
            value={formatCurrency(result.totalUnitCost)}
            subtext={`${MARGIN_TYPE_LABELS[result.marginType]}: ${result.profitMargin}%`}
          />
        </Card>
      </div>

      {result.indirectBreakdown.length > 0 && (
        <Card variant="muted">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
            Desglose de gastos indirectos
          </p>
          <div className="space-y-1.5">
            {result.indirectBreakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm gap-2">
                <span className="text-zinc-600 truncate">
                  {item.name || `Gasto ${idx + 1}`}
                  <span className="text-zinc-400 text-xs ml-1">
                    ({DISTRIBUTION_CRITERIA_SHORT[item.criteria]})
                  </span>
                </span>
                <span className="font-semibold text-zinc-800 tabular-nums shrink-0">
                  {formatCurrency(item.perUnit)}/u
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">
            Distribuido entre {inventoryCount + 1} producto{inventoryCount + 1 !== 1 ? 's' : ''} activo
            {inventoryCount + 1 !== 1 ? 's' : ''}
          </p>
        </Card>
      )}

      {totalMonthlyIndirect > 0 && result.productionUnits > 0 && (
        <Card variant="muted">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
            Cobertura de gastos fijos
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600">Total gastos del período</span>
              <span className="font-medium">{formatCurrency(totalMonthlyIndirect)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Cubierto por este producto</span>
              <span className="font-medium text-emerald-700">{formatCurrency(coverage.covered)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${coverage.percent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-zinc-600">{coverage.percent.toFixed(0)}%</span>
          </div>
          {coverage.gap > 0 && (
            <p className="text-xs text-amber-700 mt-2">
              Quedan {formatCurrency(coverage.gap)} sin cubrir con este producto.
            </p>
          )}
        </Card>
      )}

      {result.productionUnits > 0 && (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">
            Proyección mensual ({result.productionUnits} uds.)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Ingresos" value={formatCurrency(monthlyRevenue)} variant="accent" />
            <StatCard
              label="Utilidad bruta"
              value={formatCurrency(monthlyGrossProfit)}
              variant="accent"
            />
          </div>
          {(taxSettings.includeSalesTax || taxSettings.includeTerritorialContribution) && (
            <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1 text-sm">
              {taxSettings.includeSalesTax && (
                <div className="flex justify-between text-zinc-600">
                  <span>IVSS estimado (10%)</span>
                  <span>-{formatCurrency(taxes.salesTax)}</span>
                </div>
              )}
              {taxSettings.includeTerritorialContribution && (
                <div className="flex justify-between text-zinc-600">
                  <span>Contrib. territorial (1%)</span>
                  <span>-{formatCurrency(taxes.territorialContribution)}</span>
                </div>
              )}
              {taxSettings.includeProfitTaxEstimate && (
                <>
                  <div className="flex justify-between text-zinc-600">
                    <span>Reserva contingencias</span>
                    <span>-{formatCurrency(taxes.contingencyReserve)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Imp. utilidades (35%)</span>
                    <span>-{formatCurrency(taxes.estimatedProfitTax)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-semibold text-zinc-900 pt-1">
                <span>Utilidad estimada</span>
                <span className="text-emerald-700">{formatCurrency(taxes.netProfit)}</span>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
