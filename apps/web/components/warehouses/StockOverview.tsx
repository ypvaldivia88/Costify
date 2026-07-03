'use client';

import { useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import type { ProductCalculation, RawMaterial, StockLevel, Warehouse } from '@costify/shared/domain/types';
import { formatCurrency } from '@costify/shared/format/currency';
import { useExchangeRatesContext } from '@/hooks/use-exchange-rates-context';
import { useUnitCatalog } from '@/hooks/use-unit-catalog';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';

interface StockOverviewProps {
  stockLevels: StockLevel[];
  warehouses: Warehouse[];
  materials: RawMaterial[];
  products: ProductCalculation[];
  valuation: { rawMaterialsValue: number; productsValue: number; totalValue: number };
  selectedWarehouseId?: string;
  onWarehouseChange: (id?: string) => void;
}

export function StockOverview({
  stockLevels,
  warehouses,
  materials,
  products,
  valuation,
  selectedWarehouseId,
  onWarehouseChange,
}: StockOverviewProps) {
  const unitCatalog = useUnitCatalog();
  const { formatEquivalents } = useExchangeRatesContext();
  const [filter, setFilter] = useState<'all' | 'raw_material' | 'product'>('all');

  const items = useMemo(() => {
    const rows: Array<{
      refType: 'raw_material' | 'product';
      refId: string;
      name: string;
      quantity: number;
      unitLabel: string;
      unitValue: number;
      totalValue: number;
    }> = [];

    const materialIds = new Set(materials.map((m) => m.id));
    const productIds = new Set(products.map((p) => p.id));

    const addItem = (
      refType: 'raw_material' | 'product',
      refId: string,
      quantity: number
    ) => {
      if (quantity <= 0) return;

      if (refType === 'raw_material' && materialIds.has(refId)) {
        const material = materials.find((m) => m.id === refId)!;
        rows.push({
          refType,
          refId,
          name: material.name,
          quantity,
          unitLabel: unitCatalog.getShortLabel(material.unitType),
          unitValue: material.unitCost,
          totalValue: material.unitCost * quantity,
        });
      }

      if (refType === 'product' && productIds.has(refId)) {
        const product = products.find((p) => p.id === refId)!;
        rows.push({
          refType,
          refId,
          name: product.name,
          quantity,
          unitLabel: product.purchaseUnit,
          unitValue: product.totalUnitCost,
          totalValue: product.totalUnitCost * quantity,
        });
      }
    };

    if (selectedWarehouseId) {
      for (const level of stockLevels) {
        if (level.warehouseId !== selectedWarehouseId) continue;
        addItem(level.refType, level.refId, level.quantity);
      }
    } else {
      const totals = new Map<string, number>();
      for (const level of stockLevels) {
        const key = `${level.refType}:${level.refId}`;
        totals.set(key, (totals.get(key) ?? 0) + level.quantity);
      }
      for (const [key, quantity] of totals.entries()) {
        const [refType, refId] = key.split(':') as ['raw_material' | 'product', string];
        addItem(refType, refId, quantity);
      }
    }

    return rows
      .filter((row) => filter === 'all' || row.refType === filter)
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [stockLevels, materials, products, selectedWarehouseId, filter, unitCatalog]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="!p-3">
          <StatCard label="Valor insumos" value={formatCurrency(valuation.rawMaterialsValue)} />
        </Card>
        <Card className="!p-3">
          <StatCard label="Valor productos" value={formatCurrency(valuation.productsValue)} />
        </Card>
        <Card className="!p-3 col-span-2 md:col-span-1">
          <StatCard label="Valor total" value={formatCurrency(valuation.totalValue)} />
          {formatEquivalents(valuation.totalValue) && (
            <p className="text-xs text-muted mt-1 tabular-nums">
              {formatEquivalents(valuation.totalValue)}
            </p>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={selectedWarehouseId ?? ''}
          onChange={(e) => onWarehouseChange(e.target.value || undefined)}
          className="min-h-11 px-3 rounded-xl border border-border bg-surface text-sm font-medium"
        >
          <option value="">Todos los almacenes</option>
          {warehouses.filter((w) => w.active).map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        {(['all', 'raw_material', 'product'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`min-h-11 px-4 py-2.5 rounded-xl text-sm font-semibold border active:scale-[0.98] transition-transform ${
              filter === f
                ? 'border-brand bg-brand-muted text-brand-foreground'
                : 'border-border text-muted'
            }`}
          >
            {f === 'all' ? 'Todo' : f === 'raw_material' ? 'Insumos' : 'Productos'}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <Card variant="muted" className="text-center py-10">
          <Package className="w-10 h-10 text-muted/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">Sin stock registrado</p>
          <p className="text-sm text-muted mt-1">Registra entradas o inventario inicial en Movimientos.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={`${item.refType}:${item.refId}`} className="!p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-sm text-muted">
                    {item.quantity.toLocaleString('es-CU')} {item.unitLabel} ·{' '}
                    {item.refType === 'raw_material' ? 'Insumo' : 'Producto'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-brand tabular-nums">{formatCurrency(item.totalValue)}</p>
                  <p className="text-xs text-muted">{formatCurrency(item.unitValue)}/ud</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
