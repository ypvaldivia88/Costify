'use client';

import type { StockMovement, Warehouse } from '@/lib/domain/types';
import { MOVEMENT_TYPE_LABELS } from '@/lib/domain/constants';
import { Card } from '@/components/ui/Card';

interface MovementHistoryProps {
  movements: StockMovement[];
  warehouses: Warehouse[];
  getItemName: (refType: 'raw_material' | 'product', refId: string) => string;
}

export function MovementHistory({ movements, warehouses, getItemName }: MovementHistoryProps) {
  if (movements.length === 0) {
    return (
      <Card variant="muted" className="text-center py-10">
        <p className="text-sm font-semibold text-foreground">Sin movimientos</p>
        <p className="text-sm text-muted mt-1">El kardex aparecerá aquí al registrar operaciones.</p>
      </Card>
    );
  }

  const warehouseName = (id: string) =>
    warehouses.find((w) => w.id === id)?.name ?? 'Almacén desconocido';

  return (
    <div className="space-y-2">
      {movements.map((movement) => (
        <Card key={movement.id} className="!p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wide text-brand bg-brand-muted px-2 py-0.5 rounded-full">
                  {MOVEMENT_TYPE_LABELS[movement.type]}
                </span>
                <span className="text-xs text-muted">
                  {new Date(movement.timestamp).toLocaleString('es-CU')}
                </span>
              </div>
              <p className="text-sm text-foreground mt-1">
                {movement.type === 'transferencia' && movement.sourceWarehouseId
                  ? `${warehouseName(movement.sourceWarehouseId)} → ${warehouseName(movement.warehouseId)}`
                  : warehouseName(movement.warehouseId)}
              </p>
              <div className="mt-2 space-y-0.5">
                {movement.lines.map((line, idx) => (
                  <p key={idx} className="text-sm text-muted">
                    {getItemName(line.refType, line.refId)}:{' '}
                    <strong className="text-foreground">
                      {line.quantity.toLocaleString('es-CU')}
                      {line.unitType ? ` ${line.unitType}` : ''}
                    </strong>
                  </p>
                ))}
              </div>
              {movement.note && (
                <p className="text-xs text-muted mt-1 italic">{movement.note}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
