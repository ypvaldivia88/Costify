'use client';

import { Edit2, Package, Trash2 } from 'lucide-react';
import type { RawMaterial } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/format/currency';
import { formatNumericInput, parseNumericInput } from '@/lib/format/numeric-input';
import { Card } from '@/components/ui/Card';

interface RawMaterialItemProps {
  material: RawMaterial;
  onEdit: () => void;
  onDelete: () => void;
  onStockChange: (stockUnits: number) => void;
}

export function RawMaterialItem({ material, onEdit, onDelete, onStockChange }: RawMaterialItemProps) {
  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-zinc-900 truncate">{material.name}</h3>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
              {new Date(material.timestamp).toLocaleDateString('es-CU')}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-zinc-500">
            <span>
              Costo unitario:{' '}
              <strong className="text-emerald-700">{formatCurrency(material.unitCost)}</strong>
            </span>
            <span>
              Compra: <strong className="text-zinc-700">{formatCurrency(material.purchasePrice)}</strong>
              {' / '}
              {material.unitsPerPackage} uds.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-2.5 min-w-11 min-h-11 flex items-center justify-center text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
            aria-label="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2.5 min-w-11 min-h-11 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            aria-label="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-100">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-zinc-400 shrink-0" />
          <label className="text-sm font-medium text-zinc-700 shrink-0">Stock:</label>
          <input
            type="number"
            inputMode="decimal"
            value={formatNumericInput(material.stockUnits)}
            onChange={(e) => onStockChange(parseNumericInput(e.target.value))}
            className="flex-1 min-h-10 px-3 py-2 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-emerald-500"
          />
          <span className="text-xs text-zinc-500 shrink-0">unidades</span>
        </div>
      </div>
    </Card>
  );
}
