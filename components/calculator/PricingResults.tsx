'use client';

import type { ProductCalculation, TaxSettings } from '@/lib/domain/types';
import {
  getIndirectCoverage,
  getTotalMonthlyIndirectCosts,
} from '@/lib/domain/calculations';
import { calculateMonthlyTaxProjection, hasActiveTaxes } from '@/lib/domain/calculations/taxes';
import { DISTRIBUTION_CRITERIA_SHORT, MARGIN_TYPE_LABELS } from '@/lib/domain/constants';
import { useUnitCatalog } from '@/hooks/use-unit-catalog';
import { formatCurrency, formatPercent } from '@/lib/format/currency';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';

interface PricingResultsProps {
  result: ProductCalculation;
  inventoryCount: number;
  taxSettings: TaxSettings;
}

export function PricingResults({ result, taxSettings }: PricingResultsProps) {
  const unitCatalog = useUnitCatalog();
  const totalMonthlyIndirect = getTotalMonthlyIndirectCosts(result.indirectCosts);
  const coverage = getIndirectCoverage(
    result.totalIndirectPerUnit,
    result.productionUnits,
    totalMonthlyIndirect
  );

  const monthlyRevenue = result.suggestedPrice * result.productionUnits;
  const monthlyGrossProfit = result.profitPerUnit * result.productionUnits;
  const taxes = calculateMonthlyTaxProjection(monthlyRevenue, monthlyGrossProfit, taxSettings);

  const hasDetails =
    (result.recipeBreakdown && result.recipeBreakdown.length > 0) ||
    result.indirectBreakdown.length > 0 ||
    totalMonthlyIndirect > 0 ||
    result.productionUnits > 0;

  return (
    <div className="space-y-3">
      <Card variant="accent" className="text-center !py-6">
        <p className="text-sm font-medium text-brand-foreground mb-1">Precio sugerido</p>
        <p className="text-4xl sm:text-5xl font-black text-foreground tabular-nums">
          {formatCurrency(result.suggestedPrice)}
        </p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-sm text-muted">
          <span>
            Costo: <strong className="text-foreground">{formatCurrency(result.totalUnitCost)}</strong>
          </span>
          <span>
            Utilidad: <strong className="text-brand">{formatCurrency(result.profitPerUnit)}</strong>
          </span>
          <span>
            Margen: <strong className="text-brand">{formatPercent(result.grossMarginPercent)}</strong>
          </span>
        </div>
      </Card>

      {hasDetails && (
        <details className="group rounded-xl border border-border bg-surface overflow-hidden">
          <summary className="px-4 py-3 text-sm font-semibold text-foreground cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
            Ver desglose completo
          </summary>
          <div className="px-4 pt-4 pb-5 space-y-4 border-t border-border">
            {result.recipeBreakdown && result.recipeBreakdown.length > 0 && (
              <Card variant="muted" className="!p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                  Materias primas
                </p>
                <div className="space-y-1.5">
                  {result.recipeBreakdown.map((item) => (
                    <div key={item.rawMaterialId} className="flex justify-between text-sm gap-2">
                      <span className="text-muted truncate">
                        {item.name}
                        <span className="text-xs opacity-70 ml-1">
                          ({item.quantity} {unitCatalog.getShortLabel(item.unitType)} ×{' '}
                          {formatCurrency(item.unitCost)}/{unitCatalog.getShortLabel(item.unitType)})
                        </span>
                      </span>
                      <span className="font-semibold text-foreground tabular-nums shrink-0">
                        {formatCurrency(item.lineCost)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Card className="!p-3">
                <StatCard label="Costo directo" value={formatCurrency(result.unitCost)} />
              </Card>
              <Card className="!p-3">
                <StatCard
                  label="Gastos indirectos"
                  value={formatCurrency(result.totalIndirectPerUnit)}
                />
              </Card>
            </div>

            {result.indirectBreakdown.length > 0 && (
              <Card variant="muted" className="!p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                  Gastos indirectos
                </p>
                <div className="space-y-1.5">
                  {result.indirectBreakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm gap-2">
                      <span className="text-muted truncate">
                        {item.name || `Gasto ${idx + 1}`}
                        <span className="text-xs opacity-70 ml-1">
                          ({DISTRIBUTION_CRITERIA_SHORT[item.criteria]})
                        </span>
                      </span>
                      <span className="font-semibold text-foreground tabular-nums shrink-0">
                        {formatCurrency(item.perUnit)}/u
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {totalMonthlyIndirect > 0 && result.productionUnits > 0 && (
              <Card variant="muted" className="!p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                  Cobertura de gastos fijos
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${coverage.percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-muted">{coverage.percent.toFixed(0)}%</span>
                </div>
              </Card>
            )}

            {result.productionUnits > 0 && (
              <Card className="!p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                  Proyección mensual ({result.productionUnits} uds.)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="Ingresos" value={formatCurrency(monthlyRevenue)} variant="accent" />
                  <StatCard
                    label="Utilidad bruta"
                    value={formatCurrency(monthlyGrossProfit)}
                    variant="accent"
                  />
                </div>
                {hasActiveTaxes(taxSettings) && taxes.totalTaxes > 0 && (
                  <p className="text-xs text-muted mt-2">
                    Utilidad estimada después de impuestos:{' '}
                    <strong className="text-brand">{formatCurrency(taxes.netProfit)}</strong>
                  </p>
                )}
                <p className="text-[11px] text-muted mt-2 opacity-70">
                  {MARGIN_TYPE_LABELS[result.marginType]}: {result.profitMargin}%
                </p>
              </Card>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
