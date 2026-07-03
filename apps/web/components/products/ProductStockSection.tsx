'use client';

import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from 'lucide-react';
import type {
  MovementType,
  ProductCalculation,
  StockLevel,
  Warehouse,
} from '@costify/shared/domain/types';
import { getStockQuantity } from '@costify/shared/domain/calculations';
import { WAREHOUSE_TYPE_LABELS } from '@costify/shared/domain/constants';
import { formatCurrency } from '@costify/shared/format/currency';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NumericField } from '@/components/ui/NumericField';
import { useToast } from '@/components/ui/Toast';

interface ProductStockSectionProps {
  product: ProductCalculation;
  warehouses: Warehouse[];
  stockLevels: StockLevel[];
  onRegisterMovement: (input: {
    type: MovementType;
    warehouseId: string;
    sourceWarehouseId?: string;
    quantity: number;
    note?: string;
  }) => void;
}

type QuickAction = 'entrada' | 'salida' | 'transferencia' | null;

export function ProductStockSection({
  product,
  warehouses,
  stockLevels,
  onRegisterMovement,
}: ProductStockSectionProps) {
  const { showToast } = useToast();
  const activeWarehouses = warehouses.filter((w) => w.active);
  const [action, setAction] = useState<QuickAction>(null);
  const [warehouseId, setWarehouseId] = useState(activeWarehouses[0]?.id ?? '');
  const [sourceWarehouseId, setSourceWarehouseId] = useState(activeWarehouses[0]?.id ?? '');
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState('');

  const totalStock = getStockQuantity(stockLevels, 'product', product.id);
  const rows = activeWarehouses.map((warehouse) => {
    const qty = getStockQuantity(stockLevels, 'product', product.id, warehouse.id);
    return {
      warehouse,
      quantity: qty,
      value: qty * product.totalUnitCost,
    };
  });

  const handleSubmit = () => {
    if (!warehouseId || quantity <= 0) {
      showToast('Indica almacén y cantidad.', 'error');
      return;
    }

    if (action === 'transferencia' && (!sourceWarehouseId || sourceWarehouseId === warehouseId)) {
      showToast('Selecciona almacenes de origen y destino distintos.', 'error');
      return;
    }

    try {
      onRegisterMovement({
        type: action!,
        warehouseId,
        sourceWarehouseId: action === 'transferencia' ? sourceWarehouseId : undefined,
        quantity,
        note: note.trim() || undefined,
      });
      showToast('Movimiento registrado', 'success');
      setAction(null);
      setQuantity(0);
      setNote('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo registrar.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="!p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm font-semibold text-foreground">Stock total</p>
          <p className="text-lg font-bold text-brand tabular-nums">
            {totalStock.toLocaleString('es-CU')} {product.purchaseUnit}
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted">No hay almacenes activos configurados.</p>
        ) : (
          <div className="space-y-2">
            {rows.map(({ warehouse, quantity: qty, value }) => (
              <div
                key={warehouse.id}
                className="flex items-center justify-between gap-2 text-sm py-2 border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{warehouse.name}</p>
                  <p className="text-xs text-muted">{WAREHOUSE_TYPE_LABELS[warehouse.type]}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold tabular-nums">
                    {qty.toLocaleString('es-CU')} {product.purchaseUnit}
                  </p>
                  {qty > 0 && (
                    <p className="text-xs text-muted tabular-nums">{formatCurrency(value)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setAction('entrada')}>
          <ArrowDownToLine className="w-4 h-4" />
          Entrada
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setAction('salida')}>
          <ArrowUpFromLine className="w-4 h-4" />
          Salida
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAction('transferencia')}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Transferir
        </Button>
      </div>

      {action && (
        <Card className="!p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {action === 'entrada' && 'Registrar entrada'}
            {action === 'salida' && 'Registrar salida'}
            {action === 'transferencia' && 'Transferir entre almacenes'}
          </p>

          {action === 'transferencia' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Origen</label>
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
                className="w-full min-h-11 px-3 rounded-xl border border-border bg-surface text-sm"
              >
                {activeWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              {action === 'transferencia' ? 'Destino' : 'Almacén'}
            </label>
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

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Cantidad</label>
            <NumericField
              value={quantity}
              onChange={setQuantity}
              className="w-full min-h-11 px-3"
            />
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota opcional"
            className="w-full min-h-11 px-3 rounded-xl border border-border bg-surface text-sm"
          />

          <div className="flex gap-2">
            <Button type="button" onClick={handleSubmit} className="flex-1">
              Confirmar
            </Button>
            <Button type="button" variant="outline" onClick={() => setAction(null)}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
