'use client';

import { useState } from 'react';
import { Edit2, ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ProductCalculation, TaxSettings } from '@costify/shared/domain/types';
import { calculateMonthlyTaxProjection, hasActiveTaxes } from '@costify/shared/domain/calculations/taxes';
import { DISTRIBUTION_CRITERIA_SHORT, PRODUCT_TYPE_LABELS } from '@costify/shared/domain/constants';
import { useUnitCatalog } from '@/hooks/use-unit-catalog';
import { formatCurrency, formatPercent } from '@costify/shared/format/currency';
import { CurrencyEquivalentsOnly } from '@/components/ui/CurrencyEquivalents';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface InventoryItemProps {
  item: ProductCalculation;
  expanded: boolean;
  taxSettings: TaxSettings;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpen?: () => void;
}

export function InventoryItem({
  item,
  expanded,
  taxSettings,
  onToggle,
  onEdit,
  onDelete,
  onOpen,
}: InventoryItemProps) {
  const unitCatalog = useUnitCatalog();
  const [menuOpen, setMenuOpen] = useState(false);
  const monthlyRevenue = item.suggestedPrice * item.productionUnits;
  const monthlyGross = item.profitPerUnit * item.productionUnits;
  const taxes = calculateMonthlyTaxProjection(monthlyRevenue, monthlyGross, taxSettings);

  const runAction = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground truncate">{item.name}</h3>
              <span className="text-xs font-semibold uppercase tracking-wide text-secondary-foreground bg-secondary px-2 py-0.5 rounded-full">
                {PRODUCT_TYPE_LABELS[item.productType ?? 'simple']}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(item.timestamp).toLocaleDateString('es-CU')}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
              <span>
                Costo: <strong className="text-foreground">{formatCurrency(item.totalUnitCost)}</strong>
              </span>
              <span>
                Margen: <strong className="text-brand">{formatPercent(item.grossMarginPercent)}</strong>
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-medium text-muted-foreground">Precio</p>
            <p className="text-xl font-bold text-brand tabular-nums">
              {formatCurrency(item.suggestedPrice)}
            </p>
            <CurrencyEquivalentsOnly cupAmount={item.suggestedPrice} className="mt-0.5" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="flex-1 min-h-11 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-colors active:scale-[0.99]"
          >
            {expanded ? 'Ocultar' : 'Resumen'}
          </button>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <Button
              variant="outline"
              size="sm"
              className="min-w-11 min-h-11 px-0"
              onClick={() => setMenuOpen(true)}
              aria-label="Acciones"
            >
              <MoreHorizontal className="size-4" />
            </Button>
            <SheetContent side="bottom" className="rounded-t-2xl sheet-safe-bottom">
              <SheetHeader>
                <SheetTitle className="text-left truncate">{item.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid gap-2">
                {onOpen ? (
                  <Button variant="secondary" className="w-full justify-start" onClick={() => runAction(onOpen)}>
                    <ExternalLink className="size-4" />
                    Ver ficha
                  </Button>
                ) : null}
                <Button variant="outline" className="w-full justify-start" onClick={() => runAction(onEdit)}>
                  <Edit2 className="size-4" />
                  Editar
                </Button>
                <Button variant="danger" className="w-full justify-start" onClick={() => runAction(onDelete)}>
                  <Trash2 className="size-4" />
                  Eliminar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border bg-muted/40"
          >
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Desglose de costos
                </p>
                <div className="space-y-1.5 text-sm">
                  {item.recipeBreakdown && item.recipeBreakdown.length > 0 && (
                    <>
                      {item.recipeBreakdown.map((rm) => (
                        <div key={rm.rawMaterialId} className="flex justify-between gap-2">
                          <span className="text-muted-foreground truncate">
                            {rm.name}{' '}
                            <span className="text-xs">
                              ({rm.quantity}{' '}
                              {rm.unitType ? unitCatalog.getShortLabel(rm.unitType) : ''} ×{' '}
                              {formatCurrency(rm.unitCost)})
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
                    <span className="text-muted-foreground">Costo directo unitario</span>
                    <span className="font-medium">{formatCurrency(item.unitCost)}</span>
                  </div>
                  {item.indirectBreakdown.map((ic, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span className="text-muted-foreground truncate">
                        {ic.name}{' '}
                        <span className="text-xs">
                          ({DISTRIBUTION_CRITERIA_SHORT[ic.criteria]})
                        </span>
                      </span>
                      <span className="font-medium tabular-nums shrink-0">
                        {formatCurrency(ic.perUnit)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium pt-2 border-t border-border">
                    <span className="text-muted-foreground">Costo de producción</span>
                    <span>{formatCurrency(item.totalUnitCost)}</span>
                  </div>
                  {(item.laborShareBreakdown?.length ?? 0) > 0 && (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">
                        Participación salarial
                      </p>
                      {item.laborShareBreakdown?.map((role) => (
                        <div key={role.roleId} className="flex justify-between gap-2">
                          <span className="text-muted-foreground truncate">
                            {role.name}{' '}
                            <span className="text-xs">
                              ({formatPercent(role.percentOfSale)} venta)
                            </span>
                          </span>
                          <span className="font-medium tabular-nums shrink-0">
                            {formatCurrency(role.perUnit)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total salarios</span>
                        <span className="font-medium">
                          {formatCurrency(item.totalLaborSharePerUnit)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Utilidad</span>
                    <span className="font-medium text-brand">{formatCurrency(item.profitPerUnit)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span>Precio sugerido</span>
                    <span className="text-brand">{formatCurrency(item.suggestedPrice)}</span>
                  </div>
                </div>
              </div>

              {item.productionUnits > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Proyección mensual ({item.productionUnits} uds.)
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ingresos</span>
                      <span className="font-medium text-brand">{formatCurrency(monthlyRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Utilidad bruta</span>
                      <span className="font-medium text-brand">{formatCurrency(monthlyGross)}</span>
                    </div>
                    {hasActiveTaxes(taxSettings) && taxes.totalTaxes > 0 && (
                      <div className="flex justify-between text-muted-foreground">
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
