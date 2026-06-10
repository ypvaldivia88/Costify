'use client';

import { useState } from 'react';
import { Package, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ProductCalculation, TaxSettings } from '@/lib/domain/types';
import { calculateBusinessSummary } from '@/lib/domain/calculations';
import { Button } from '@/components/ui/Button';
import { BusinessSummaryCard } from './BusinessSummaryCard';
import { InventoryItem } from './InventoryItem';

interface InventoryListProps {
  items: ProductCalculation[];
  taxSettings: TaxSettings;
  onDelete: (id: string) => void;
  onEdit: (item: ProductCalculation) => void;
  onRecalculateAll: () => void;
}

export function InventoryList({
  items,
  taxSettings,
  onDelete,
  onEdit,
  onRecalculateAll,
}: InventoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const summary = calculateBusinessSummary(items, taxSettings);

  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white rounded-2xl border-2 border-dashed border-zinc-200">
        <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-600 font-semibold">Sin productos guardados</p>
        <p className="text-zinc-400 text-sm mt-1">
          Usa la calculadora para crear tu primera ficha de costos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-500">
          {items.length} producto{items.length !== 1 ? 's' : ''}
        </p>
        <Button variant="outline" size="sm" onClick={onRecalculateAll}>
          <RefreshCw className="w-3.5 h-3.5" /> Recalcular
        </Button>
      </div>

      <BusinessSummaryCard summary={summary} taxSettings={taxSettings} />

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
                onDelete={() => onDelete(item.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
