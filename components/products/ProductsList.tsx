'use client';

import { useState } from 'react';
import { Package, Plus, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ProductCalculation, TaxSettings } from '@/lib/domain/types';
import { calculateBusinessSummary } from '@/lib/domain/calculations';
import { formatCurrency } from '@/lib/format/currency';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { BusinessSummaryCard } from '@/components/inventory/BusinessSummaryCard';
import { InventoryItem } from '@/components/inventory/InventoryItem';

interface ProductsListProps {
  items: ProductCalculation[];
  taxSettings: TaxSettings;
  onDelete: (id: string) => void;
  onSelect: (item: ProductCalculation) => void;
  onEdit: (item: ProductCalculation) => void;
  onNew: () => void;
  onRecalculateAll: () => void;
  stockValuation?: { rawMaterialsValue: number; productsValue: number; totalValue: number };
}

export function ProductsList({
  items,
  taxSettings,
  onDelete,
  onSelect,
  onEdit,
  onNew,
  onRecalculateAll,
  stockValuation,
}: ProductsListProps) {
  const { confirm } = useConfirm();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const summary = calculateBusinessSummary(items, taxSettings);

  const handleDelete = async (item: ProductCalculation) => {
    const confirmed = await confirm({
      title: 'Eliminar producto',
      message: `¿Eliminar "${item.name}"? Se eliminará la ficha de costo y sus movimientos de stock asociados.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (confirmed) onDelete(item.id);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-surface rounded-2xl border-2 border-dashed border-border">
        <Package className="w-12 h-12 text-muted/40 mx-auto mb-4" />
        <p className="text-foreground font-semibold">Sin productos</p>
        <p className="text-muted text-sm mt-1 max-w-xs mx-auto">
          Crea tu primera ficha de costo para calcular el precio de venta sugerido.
        </p>
        <Button type="button" className="mt-4" onClick={onNew}>
          <Plus className="w-4 h-4" />
          Nuevo producto
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted">
          {items.length} producto{items.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRecalculateAll}>
            <RefreshCw className="w-3.5 h-3.5" /> Recalcular
          </Button>
          <Button size="sm" onClick={onNew}>
            <Plus className="w-4 h-4" /> Nuevo
          </Button>
        </div>
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
                onOpen={() => onSelect(item)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
