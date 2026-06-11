'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { RawMaterial, RecipeItem } from '@/lib/domain/types';
import { UNIT_SHORT_LABELS } from '@/lib/domain/constants';
import { formatCurrency } from '@/lib/format/currency';
import { Button } from '@/components/ui/Button';
import { NumericField } from '@/components/ui/NumericField';
import { cn } from '@/lib/utils';

interface RecipeEditorProps {
  recipe: RecipeItem[];
  rawMaterials: RawMaterial[];
  onChange: (recipe: RecipeItem[]) => void;
}

const fieldClass = cn(
  'min-h-11 px-3 py-2 text-sm rounded-xl border border-border bg-surface text-foreground',
  'focus:outline-none focus:border-brand'
);

export function RecipeEditor({ recipe, rawMaterials, onChange }: RecipeEditorProps) {
  const usedIds = new Set(recipe.map((r) => r.rawMaterialId));
  const availableMaterials = rawMaterials.filter((m) => !usedIds.has(m.id));

  const addItem = () => {
    if (availableMaterials.length === 0) return;
    onChange([...recipe, { rawMaterialId: availableMaterials[0].id, quantity: 1 }]);
  };

  const updateItem = (index: number, updates: Partial<RecipeItem>) => {
    onChange(recipe.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  const removeItem = (index: number) => {
    onChange(recipe.filter((_, i) => i !== index));
  };

  const totalCost = recipe.reduce((sum, item) => {
    const material = rawMaterials.find((m) => m.id === item.rawMaterialId);
    if (!material || item.quantity <= 0) return sum;
    return sum + material.unitCost * item.quantity;
  }, 0);

  if (rawMaterials.length === 0) {
    return (
      <div className="rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
        Registra materias primas primero para confeccionar un producto elaborado.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Receta</label>
        <Button
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={availableMaterials.length === 0}
          type="button"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </Button>
      </div>

      {recipe.length === 0 ? (
        <p className="text-sm text-muted py-2">Agrega materias primas y cantidades por unidad.</p>
      ) : (
        <div className="space-y-2">
          {recipe.map((item, index) => {
            const material = rawMaterials.find((m) => m.id === item.rawMaterialId);
            const lineCost = material ? material.unitCost * item.quantity : 0;
            const unitLabel = material ? UNIT_SHORT_LABELS[material.unitType] : '';

            return (
              <div
                key={`${item.rawMaterialId}-${index}`}
                className="flex flex-col sm:flex-row gap-2 p-3 rounded-xl border border-border bg-surface-muted/50"
              >
                <select
                  value={item.rawMaterialId}
                  onChange={(e) => updateItem(index, { rawMaterialId: e.target.value })}
                  className={cn('flex-1', fieldClass)}
                >
                  {rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatCurrency(m.unitCost)}/{UNIT_SHORT_LABELS[m.unitType]})
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <NumericField
                    value={item.quantity}
                    onChange={(quantity) => updateItem(index, { quantity })}
                    className="w-24"
                    aria-label="Cantidad"
                  />
                  <span className="text-xs text-muted shrink-0">{unitLabel}</span>
                  <button
                    onClick={() => removeItem(index)}
                    className="p-2.5 min-w-11 min-h-11 flex items-center justify-center text-muted hover:text-red-500 rounded-xl transition-colors"
                    aria-label="Eliminar"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="sm:text-right sm:min-w-28">
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {formatCurrency(lineCost)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recipe.length > 0 && (
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-sm font-medium text-foreground">Costo directo por unidad</span>
          <span className="text-lg font-bold text-brand tabular-nums">{formatCurrency(totalCost)}</span>
        </div>
      )}
    </div>
  );
}
