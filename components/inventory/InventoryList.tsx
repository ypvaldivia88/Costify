'use client';

import { useState } from 'react';
import { Package, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  ProductCalculation,
  RawMaterial,
  TaxSettings,
  UnitSettings,
  Warehouse,
} from '@/lib/domain/types';
import { calculateBusinessSummary } from '@/lib/domain/calculations';
import { formatCurrency } from '@/lib/format/currency';
import { ProductionDialog } from '@/components/warehouses/ProductionDialog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { BusinessSummaryCard } from './BusinessSummaryCard';
import { InventoryItem } from './InventoryItem';

interface InventoryListProps {
  items: ProductCalculation[];
  taxSettings: TaxSettings;
  materials: RawMaterial[];
  warehouses: Warehouse[];
  unitSettings: UnitSettings;
  onDelete: (id: string) => void;
  onEdit: (item: ProductCalculation) => void;
  onRecalculateAll: () => void;
  onRegisterProduction: (
    product: ProductCalculation,
    quantity: number,
    warehouseId?: string,
    note?: string
  ) => void;
  stockValuation?: { rawMaterialsValue: number; productsValue: number; totalValue: number };
}

export function InventoryList({
  items,
  taxSettings,
  materials,
  warehouses,
  unitSettings,
  onDelete,
  onEdit,
  onRecalculateAll,
  onRegisterProduction,
  stockValuation,
}: InventoryListProps) {
  const { confirm } = useConfirm();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [productionProduct, setProductionProduct] = useState<ProductCalculation | null>(null);
  const summary = calculateBusinessSummary(items, taxSettings);

  const handleDelete = async (item: ProductCalculation) => {
    const confirmed = await confirm({
      title: 'Eliminar producto',
      message: `¿Eliminar "${item.name}" del historial? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (confirmed) onDelete(item.id);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-surface rounded-2xl border-2 border-dashed border-border">
        <Package className="w-12 h-12 text-muted/40 mx-auto mb-4" />
        <p className="text-foreground font-semibold">Sin productos guardados</p>
        <p className="text-muted text-sm mt-1 max-w-xs mx-auto">
          Usa la calculadora para crear tu primera ficha de costos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted">
          {items.length} producto{items.length !== 1 ? 's' : ''}
        </p>
        <Button variant="outline" size="sm" onClick={onRecalculateAll}>
          <RefreshCw className="w-3.5 h-3.5" /> Recalcular
        </Button>
      </div>

      <BusinessSummaryCard summary={summary} taxSettings={taxSettings} />

      {stockValuation && stockValuation.totalValue > 0 && (
        <Card className="!p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted mb-3">
            Inventario físico en almacén
          </p>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Insumos" value={formatCurrency(stockValuation.rawMaterialsValue)} />
            <StatCard label="Productos" value={formatCurrency(stockValuation.productsValue)} />
            <StatCard label="Total" value={formatCurrency(stockValuation.totalValue)} variant="accent" />
          </div>
        </Card>
      )}

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <InventoryItem
                item={item}
                expanded={expandedId === item.id}
                taxSettings={taxSettings}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onEdit={() => onEdit(item)}
                onDelete={() => handleDelete(item)}
                onRegisterProduction={
                  item.productType === 'elaborated' && item.recipe && item.recipe.length > 0
                    ? () => setProductionProduct(item)
                    : undefined
                }
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {productionProduct && (
        <ProductionDialog
          product={productionProduct}
          materials={materials}
          warehouses={warehouses}
          unitSettings={unitSettings}
          onProduce={(quantity, warehouseId, note) =>
            onRegisterProduction(productionProduct, quantity, warehouseId, note)
          }
          onClose={() => setProductionProduct(null)}
        />
      )}
    </div>
  );
}
