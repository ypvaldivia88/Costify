'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { RawMaterial, RecipeItem } from '@/lib/domain/types';
import { formatCurrency } from '@/lib/format/currency';
import { formatNumericInput, parseNumericInput } from '@/lib/format/numeric-input';
import { Button } from '@/components/ui/Button';

interface RecipeEditorProps {
  recipe: RecipeItem[];
  rawMaterials: RawMaterial[];
  onChange: (recipe: RecipeItem[]) => void;
}

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
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        No hay materias primas registradas. Ve a la pestaña &quot;Materias primas&quot; para
        agregarlas antes de confeccionar un producto elaborado.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">Receta (materias primas)</label>
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
        <p className="text-sm text-zinc-500 py-2">
          Selecciona las materias primas y cantidades necesarias para una unidad del producto.
        </p>
      ) : (
        <div className="space-y-2">
          {recipe.map((item, index) => {
            const material = rawMaterials.find((m) => m.id === item.rawMaterialId);
            const lineCost = material ? material.unitCost * item.quantity : 0;
            const stockAfter =
              material && item.quantity > 0
                ? material.stockUnits - item.quantity
                : material?.stockUnits;

            return (
              <div
                key={`${item.rawMaterialId}-${index}`}
                className="flex flex-col sm:flex-row gap-2 p-3 rounded-xl border border-zinc-200 bg-zinc-50/50"
              >
                <select
                  value={item.rawMaterialId}
                  onChange={(e) => updateItem(index, { rawMaterialId: e.target.value })}
                  className="flex-1 min-h-11 px-3 py-2 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-emerald-500"
                >
                  {rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatCurrency(m.unitCost)}/u)
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={formatNumericInput(item.quantity)}
                    onChange={(e) =>
                      updateItem(index, { quantity: parseNumericInput(e.target.value) })
                    }
                    className="w-24 min-h-11 px-3 py-2 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-emerald-500"
                    aria-label="Cantidad"
                  />
                  <span className="text-xs text-zinc-500 shrink-0">uds.</span>
                  <button
                    onClick={() => removeItem(index)}
                    className="p-2.5 min-w-11 min-h-11 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    aria-label="Eliminar"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="sm:text-right sm:min-w-28">
                  <p className="text-sm font-semibold text-zinc-800 tabular-nums">
                    {formatCurrency(lineCost)}
                  </p>
                  {material && (
                    <p className="text-[11px] text-zinc-400">
                      Stock: {material.stockUnits} uds.
                      {item.quantity > 0 && stockAfter !== undefined && (
                        <span className={stockAfter < 0 ? ' text-red-500' : ''}>
                          {' '}
                          (queda {stockAfter.toFixed(2)})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recipe.length > 0 && (
        <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
          <span className="text-sm font-medium text-zinc-700">Costo directo por unidad</span>
          <span className="text-lg font-bold text-emerald-700 tabular-nums">
            {formatCurrency(totalCost)}
          </span>
        </div>
      )}
    </div>
  );
}
