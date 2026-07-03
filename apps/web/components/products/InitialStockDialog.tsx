'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import type { ProductCalculation, Warehouse } from '@costify/shared/domain/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NumericField } from '@/components/ui/NumericField';

interface InitialStockDialogProps {
  product: ProductCalculation;
  warehouses: Warehouse[];
  defaultWarehouseId?: string;
  onConfirm: (quantity: number, warehouseId: string) => void;
  onSkip: () => void;
}

export function InitialStockDialog({
  product,
  warehouses,
  defaultWarehouseId,
  onConfirm,
  onSkip,
}: InitialStockDialogProps) {
  const activeWarehouses = warehouses.filter((w) => w.active);
  const [quantity, setQuantity] = useState(0);
  const [warehouseId, setWarehouseId] = useState(
    defaultWarehouseId ??
      activeWarehouses.find((w) => w.type === 'principal')?.id ??
      activeWarehouses[0]?.id ??
      ''
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-0 sm:pb-4 bg-black/40">
      <Card className="w-full max-w-md !p-5 rounded-t-2xl sm:rounded-2xl sheet-safe-bottom">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-bold text-foreground">Stock inicial</h2>
        </div>
        <p className="text-sm text-muted mb-4">
          ¿Registrar stock inicial de <strong className="text-foreground">{product.name}</strong> en
          un almacén?
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Cantidad</label>
            <NumericField
              value={quantity}
              onChange={setQuantity}
              className="w-full min-h-11 px-3"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Almacén</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full min-h-11 px-3 rounded-xl border border-border bg-surface text-sm"
            >
              {activeWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              disabled={quantity <= 0 || !warehouseId}
              onClick={() => onConfirm(quantity, warehouseId)}
            >
              Registrar stock
            </Button>
            <Button type="button" variant="outline" onClick={onSkip}>
              Omitir por ahora
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
