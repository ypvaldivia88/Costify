'use client';

import type { ProductCalculation, RawMaterial } from '@costify/shared/domain/types';
import { calculateMarginSensitivity } from '@costify/shared/domain/exchange-rates';
import { useExchangeRatesContext } from '@/hooks/use-exchange-rates-context';
import { formatCurrency, formatPercent } from '@costify/shared/format/currency';

interface MarginSensitivityTableProps {
  product: ProductCalculation;
  materials: RawMaterial[];
}

export function MarginSensitivityTable({ product, materials }: MarginSensitivityTableProps) {
  const { snapshot } = useExchangeRatesContext();
  const rows = calculateMarginSensitivity(product, materials, snapshot);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">
        Este producto no tiene costos vinculados a divisas; la sensibilidad cambiaria no aplica.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted">
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
              className={`border-t border-border ${
                row.rateMultiplier === 1 ? 'bg-brand-muted/40' : ''
              }`}
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
  );
}
