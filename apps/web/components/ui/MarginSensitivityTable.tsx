'use client';

import type { ProductCalculation, RawMaterial } from '@costify/shared/domain/types';
import { calculateMarginSensitivity } from '@costify/shared/domain/exchange-rates';
import { useExchangeRatesContext } from '@/hooks/use-exchange-rates-context';
import { formatCurrency, formatPercent } from '@costify/shared/format/currency';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface MarginSensitivityTableProps {
  product: ProductCalculation;
  materials: RawMaterial[];
}

export function MarginSensitivityTable({ product, materials }: MarginSensitivityTableProps) {
  const { snapshot } = useExchangeRatesContext();
  const rows = calculateMarginSensitivity(product, materials, snapshot);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Este producto no tiene costos vinculados a divisas; la sensibilidad cambiaria no aplica.
      </p>
    );
  }

  return (
    <>
      <div className="md:hidden space-y-3">
        {rows.map((row) => (
          <Card
            key={row.label}
            variant={row.rateMultiplier === 1 ? 'accent' : 'default'}
            className={cn('!p-4 space-y-2')}
          >
            <p className="font-semibold text-foreground">{row.label}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">USD</p>
                <p className="tabular-nums font-medium">{row.usdRate.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Costo</p>
                <p className="tabular-nums font-medium">{formatCurrency(row.unitCost)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Precio</p>
                <p className="tabular-nums font-semibold text-brand">{formatCurrency(row.suggestedPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Margen</p>
                <p className="tabular-nums font-medium">{formatPercent(row.marginPercent)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 font-semibold">Escenario</th>
              <th className="py-2 pr-3 font-semibold">USD</th>
              <th className="py-2 pr-3 font-semibold">Costo</th>
              <th className="py-2 pr-3 font-semibold">Precio</th>
              <th className="py-2 font-semibold">Margen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className={cn(
                  'border-t border-border',
                  row.rateMultiplier === 1 && 'bg-brand-muted/40'
                )}
              >
                <td className="py-2 pr-3 font-medium">{row.label}</td>
                <td className="py-2 pr-3 tabular-nums">{row.usdRate.toFixed(0)}</td>
                <td className="py-2 pr-3 tabular-nums">{formatCurrency(row.unitCost)}</td>
                <td className="py-2 pr-3 tabular-nums text-brand font-medium">
                  {formatCurrency(row.suggestedPrice)}
                </td>
                <td className="py-2 tabular-nums">{formatPercent(row.marginPercent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
