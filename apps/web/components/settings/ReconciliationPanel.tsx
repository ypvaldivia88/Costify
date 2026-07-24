'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, FileUp, Scale } from 'lucide-react';
import type { Location } from '@costify/shared/domain/location';
import { findLocationByCode } from '@costify/shared/domain/location';
import type { ProductCalculation, StockMovement } from '@costify/shared/domain/types';
import { calculateReconciliationReport } from '@costify/shared/domain/calculations/reconciliation';
import type { SaleRecord } from '@costify/shared/domain/sales';
import {
  getSaleCsvTemplate,
  groupSaleCsvRowsIntoRecords,
  parseSaleCsv,
} from '@costify/shared/domain/sales';
import { RECONCILIATION_GUIDE_ITEMS } from '@costify/shared';
import { randomId } from '@costify/shared/random-id';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface ReconciliationPanelProps {
  locations: Location[];
  products: ProductCalculation[];
  sales: SaleRecord[];
  stockMovements: StockMovement[];
  onImportSales: (records: SaleRecord[]) => void;
}

export function ReconciliationPanel({
  locations,
  products,
  sales,
  stockMovements,
  onImportSales,
}: ReconciliationPanelProps) {
  const { showToast } = useToast();
  const [locationId, setLocationId] = useState(locations.find((l) => l.active)?.id ?? locations[0]?.id ?? '');
  const [csvText, setCsvText] = useState('');

  const report = useMemo(() => {
    if (!locationId) return null;
    const to = Date.now();
    const from = to - 30 * 24 * 60 * 60 * 1000;
    return calculateReconciliationReport({
      sales,
      stockMovements,
      products,
      locationId,
      from,
      to,
    });
  }, [sales, stockMovements, products, locationId]);

  const alerts = report?.variances.filter((item) => item.severity !== 'ok') ?? [];

  function handleImport() {
    const parsed = parseSaleCsv(csvText);
    if (parsed.errors.length > 0) {
      showToast(parsed.errors[0] ?? 'CSV inválido', 'error');
      return;
    }
    const result = groupSaleCsvRowsIntoRecords(
      parsed.rows,
      (code) => findLocationByCode(locations, code)?.id,
      (sku) => products.find((p) => p.posSku?.toUpperCase() === sku.toUpperCase())?.id,
      () => randomId()
    );
    if (result.errors.length > 0) {
      showToast(result.errors[0] ?? 'Error al importar', 'error');
      return;
    }
    if (result.records.length === 0) {
      showToast('No hay filas válidas para importar.', 'error');
      return;
    }
    onImportSales(result.records);
    setCsvText('');
    showToast(`Importadas ${result.records.length} ventas.`);
  }

  return (
    <Card>
      <SectionHeader
        icon={Scale}
        title="Conciliación ventas vs inventario"
        description="Compara lo vendido (caja o CSV) con las salidas de inventario. Últimos 30 días."
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <label className="text-sm">
          <span className="text-muted-foreground block mb-1">Local</span>
          <select
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm min-w-[12rem]"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4 mb-6 space-y-3">
        <p className="text-sm font-medium flex items-center gap-2">
          <FileUp className="w-4 h-4" />
          Importar ventas (CSV)
        </p>
        <p className="text-xs text-muted-foreground font-mono">{getSaleCsvTemplate()}</p>
        <textarea
          className="w-full min-h-[120px] rounded-xl border border-border bg-background p-3 text-sm font-mono"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Pega aquí el CSV exportado de caja…"
        />
        <Button type="button" variant="outline" onClick={handleImport}>
          Importar ventas
        </Button>
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin desviaciones críticas en el período.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-3">Producto</th>
                <th className="py-2 pr-3">Vendido</th>
                <th className="py-2 pr-3">Salida inv.</th>
                <th className="py-2 pr-3">Delta</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((row) => (
                <tr key={row.productId} className="border-b border-border/60">
                  <td className="py-2 pr-3">
                    <span className="font-medium">{row.productName}</span>
                    {row.posSku ? (
                      <span className="block text-xs text-muted-foreground">{row.posSku}</span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{row.soldQty}</td>
                  <td className="py-2 pr-3 tabular-nums">{row.stockOutQty}</td>
                  <td
                    className={cn(
                      'py-2 pr-3 tabular-nums font-semibold flex items-center gap-1',
                      row.severity === 'critical' ? 'text-destructive' : 'text-amber-600'
                    )}
                  >
                    {row.severity === 'critical' ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : null}
                    {row.delta > 0 ? '+' : ''}
                    {row.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-border bg-surface-muted/40 p-4 space-y-3">
        <p className="text-sm font-semibold">Cómo usar la conciliación</p>
        <ul className="space-y-3 text-sm text-muted-foreground">
          {RECONCILIATION_GUIDE_ITEMS.map((item) => (
            <li key={item.title}>
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="mt-0.5">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
