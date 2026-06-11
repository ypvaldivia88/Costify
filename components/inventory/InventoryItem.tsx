'use client';

import { Edit2, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ProductCalculation, TaxSettings } from '@/lib/domain/types';
import { calculateMonthlyTaxProjection } from '@/lib/domain/calculations/taxes';
import { DISTRIBUTION_CRITERIA_SHORT, PRODUCT_TYPE_LABELS } from '@/lib/domain/constants';
import { formatCurrency, formatPercent } from '@/lib/format/currency';
import { Card } from '@/components/ui/Card';

interface InventoryItemProps {
  item: ProductCalculation;
  expanded: boolean;
  taxSettings: TaxSettings;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function InventoryItem({
  item,
  expanded,
  taxSettings,
  onToggle,
  onEdit,
  onDelete,
}: InventoryItemProps) {
  const monthlyRevenue = item.suggestedPrice * item.productionUnits;
  const monthlyGross = item.profitPerUnit * item.productionUnits;
  const taxes = calculateMonthlyTaxProjection(monthlyRevenue, monthlyGross, taxSettings);

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground truncate">{item.name}</h3>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted bg-surface-muted px-2 py-0.5 rounded-full">
                {PRODUCT_TYPE_LABELS[item.productType ?? 'simple']}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted bg-surface-muted px-2 py-0.5 rounded-full">
                {new Date(item.timestamp).toLocaleDateString('es-CU')}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted">
              <span>
                Costo: <strong className="text-foreground">{formatCurrency(item.totalUnitCost)}</strong>
              </span>
              <span>
                Margen: <strong className="text-brand">{formatPercent(item.grossMarginPercent)}</strong>
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-semibold uppercase text-muted">Precio</p>
            <p className="text-xl font-black text-brand tabular-nums">
              {formatCurrency(item.suggestedPrice)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="flex-1 py-2.5 bg-surface-muted text-foreground rounded-xl text-sm font-semibold hover:bg-surface-muted transition-colors min-h-11"
          >
            {expanded ? 'Ocultar detalles' : 'Ver detalles'}
          </button>
          <button
            onClick={onEdit}
            className="p-2.5 min-w-11 min-h-11 flex items-center justify-center text-muted hover:text-brand hover:bg-brand-muted rounded-xl transition-colors"
            aria-label="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2.5 min-w-11 min-h-11 flex items-center justify-center text-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            aria-label="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border bg-surface-muted/80"
          >
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                  Desglose de costos
                </p>
                <div className="space-y-1.5 text-sm">
                  {item.recipeBreakdown && item.recipeBreakdown.length > 0 && (
                    <>
                      {item.recipeBreakdown.map((rm) => (
                        <div key={rm.rawMaterialId} className="flex justify-between gap-2">
                          <span className="text-muted truncate">
                            {rm.name}{' '}
                            <span className="text-xs text-muted">
                              ({rm.quantity} × {formatCurrency(rm.unitCost)})
                            </span>
                          </span>
                          <span className="font-medium tabular-nums shrink-0">
                            {formatCurrency(rm.lineCost)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted">Costo directo unitario</span>
                    <span className="font-medium">{formatCurrency(item.unitCost)}</span>
                  </div>
                  {item.indirectBreakdown.map((ic, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span className="text-muted truncate">
                        {ic.name}{' '}
                        <span className="text-xs text-muted">
                          ({DISTRIBUTION_CRITERIA_SHORT[ic.criteria]})
                        </span>
                      </span>
                      <span className="font-medium tabular-nums shrink-0">
                        {formatCurrency(ic.perUnit)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span>Costo total unitario</span>
                    <span>{formatCurrency(item.totalUnitCost)}</span>
                  </div>
                </div>
              </div>

              {item.productionUnits > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
                    Proyección mensual ({item.productionUnits} uds.)
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Ingresos</span>
                      <span className="font-medium text-brand">{formatCurrency(monthlyRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Utilidad bruta</span>
                      <span className="font-medium text-brand">{formatCurrency(monthlyGross)}</span>
                    </div>
                    {(taxSettings.includeSalesTax || taxSettings.includeTerritorialContribution) && (
                      <div className="flex justify-between text-muted">
                        <span>Después de impuestos estimados</span>
                        <span className="font-medium">{formatCurrency(taxes.netProfit)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
