'use client';

import { Edit2, Package, Trash2 } from 'lucide-react';
import type { RawMaterial, StockLevel, Warehouse } from '@/lib/domain/types';
import { getStockQuantity } from '@/lib/domain/calculations';
import { useUnitCatalog } from '@/hooks/use-unit-catalog';
import { formatCurrency } from '@/lib/format/currency';
import { Card } from '@/components/ui/Card';
import { NumericField } from '@/components/ui/NumericField';

interface RawMaterialItemProps {
  material: RawMaterial;
  warehouses: Warehouse[];
  stockLevels: StockLevel[];
  defaultWarehouse?: Warehouse;
  onEdit: () => void;
  onDelete: () => void;
  onStockChange: (stockQuantity: number) => void;
}

export function RawMaterialItem({
  material,
  warehouses,
  stockLevels,
  defaultWarehouse,
  onEdit,
  onDelete,
  onStockChange,
}: RawMaterialItemProps) {
  const unitCatalog = useUnitCatalog();
  const unitLabel = unitCatalog.getShortLabel(material.unitType);
  const activeWarehouses = warehouses.filter((w) => w.active);
  const warehouseRows = activeWarehouses.map((warehouse) => ({
    warehouse,
    quantity: getStockQuantity(stockLevels, 'raw_material', material.id, warehouse.id),
  }));

  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground truncate">{material.name}</h3>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted bg-surface-muted px-2 py-0.5 rounded-full">
              {new Date(material.timestamp).toLocaleDateString('es-CU')}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted">
            <span>
              Costo:{' '}
              <strong className="text-brand">
                {formatCurrency(material.unitCost)}/{unitLabel}
              </strong>
            </span>
            <span>
              Compra:{' '}
              <strong className="text-foreground">
                {formatCurrency(material.purchasePrice)}
              </strong>
              {' · '}
              {material.packageQuantity} {unitLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-2.5 min-w-11 min-h-11 flex items-center justify-center text-muted hover:text-brand hover:bg-brand-muted rounded-xl transition-colors"
            aria-label="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2.5 min-w-11 min-h-11 flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
            aria-label="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {warehouseRows.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Stock por almacén</p>
          {warehouseRows.map(({ warehouse, quantity }) => (
            <div key={warehouse.id} className="flex justify-between text-sm">
              <span className="text-muted truncate">{warehouse.name}</span>
              <span className="font-medium tabular-nums shrink-0">
                {quantity.toLocaleString('es-CU')} {unitLabel}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted shrink-0" />
          <label className="text-sm font-medium text-foreground shrink-0">Ajustar stock:</label>
          <NumericField
            value={material.stockQuantity}
            onChange={onStockChange}
            className="flex-1 min-h-10"
          />
          <span className="text-xs text-muted shrink-0">{unitLabel}</span>
        </div>
        {defaultWarehouse && (
          <p className="text-[11px] text-muted mt-1.5">
            Los ajustes se aplican en <strong>{defaultWarehouse.name}</strong>.
          </p>
        )}
      </div>
    </Card>
  );
}
