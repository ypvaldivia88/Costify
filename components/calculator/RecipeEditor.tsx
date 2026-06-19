'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { RawMaterial, RecipeItem, UnitSettings, UnitType } from '@/lib/domain/types';
import { useUnitCatalog } from '@/hooks/use-unit-catalog';
import {
  getRecipeUnitOptions,
  materialUnitCostInRecipeUnit,
  recipeQuantityInMaterialUnit,
  resolveRecipeUnit,
} from '@/lib/domain/units';
import { formatCurrency } from '@/lib/format/currency';
import { Button } from '@/components/ui/Button';
import { NumericField } from '@/components/ui/NumericField';
import { fieldClassNameCompact } from '@/lib/ui/field-styles';
import { cn } from '@/lib/utils';

interface RecipeEditorProps {
  recipe: RecipeItem[];
  rawMaterials: RawMaterial[];
  onChange: (recipe: RecipeItem[]) => void;
}

function lineCost(item: RecipeItem, material: RawMaterial, unitSettings: UnitSettings): number {
  const recipeUnit = resolveRecipeUnit(item, material.unitType, unitSettings);
  const qty = recipeQuantityInMaterialUnit(
    item.quantity,
    recipeUnit,
    material.unitType,
    unitSettings
  );
  return material.unitCost * qty;
}

export function RecipeEditor({ recipe, rawMaterials, onChange }: RecipeEditorProps) {
  const unitCatalog = useUnitCatalog();
  const unitSettings = unitCatalog.settings;
  const usedIds = new Set(recipe.map((r) => r.rawMaterialId));
  const availableMaterials = rawMaterials.filter((m) => !usedIds.has(m.id));

  const addItem = () => {
    if (availableMaterials.length === 0) return;
    const material = availableMaterials[0];
    onChange([
      ...recipe,
      { rawMaterialId: material.id, quantity: 1, unitType: material.unitType },
    ]);
  };

  const updateItem = (index: number, updates: Partial<RecipeItem>) => {
    onChange(recipe.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  const changeMaterial = (index: number, rawMaterialId: string) => {
    const material = rawMaterials.find((m) => m.id === rawMaterialId);
    const item = recipe[index];
    const updates: Partial<RecipeItem> = { rawMaterialId };
    if (material) {
      const currentUnit = resolveRecipeUnit(item, material.unitType, unitSettings);
      const options = getRecipeUnitOptions(material.unitType, unitSettings);
      if (!options.includes(currentUnit)) {
        updates.unitType = material.unitType;
      }
    }
    updateItem(index, updates);
  };

  const removeItem = (index: number) => {
    onChange(recipe.filter((_, i) => i !== index));
  };

  const totalCost = recipe.reduce((sum, item) => {
    const material = rawMaterials.find((m) => m.id === item.rawMaterialId);
    if (!material || item.quantity <= 0) return sum;
    return sum + lineCost(item, material, unitSettings);
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
      <div className="flex items-center justify-between gap-2">
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

      <p className="text-xs text-muted">
        Puedes usar otra unidad que la de compra (ej. gramos si compraste en kg).
      </p>

      {recipe.length === 0 ? (
        <p className="text-sm text-muted py-2">Agrega materias primas y cantidades por unidad de producto.</p>
      ) : (
        <div className="space-y-2">
          {recipe.map((item, index) => {
            const material = rawMaterials.find((m) => m.id === item.rawMaterialId);
            if (!material) return null;

            const recipeUnit = resolveRecipeUnit(item, material.unitType, unitSettings);
            const unitOptions = getRecipeUnitOptions(material.unitType, unitSettings);
            const cost = lineCost(item, material, unitSettings);
            const displayUnitCost = materialUnitCostInRecipeUnit(
              material.unitCost,
              material.unitType,
              recipeUnit,
              unitSettings
            );

            return (
              <div
                key={`${item.rawMaterialId}-${index}`}
                className="p-3 rounded-xl border border-border bg-surface-muted/50 space-y-2"
              >
                <select
                  value={item.rawMaterialId}
                  onChange={(e) => changeMaterial(index, e.target.value)}
                  className={cn('w-full', fieldClassNameCompact)}
                >
                  {rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatCurrency(m.unitCost)}/{unitCatalog.getShortLabel(m.unitType)})
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap items-center gap-2">
                  <NumericField
                    value={item.quantity}
                    onChange={(quantity) => updateItem(index, { quantity })}
                    className="w-24"
                    aria-label="Cantidad"
                  />
                  <select
                    value={recipeUnit}
                    onChange={(e) =>
                      updateItem(index, { unitType: e.target.value as UnitType })
                    }
                    className={cn('w-28', fieldClassNameCompact)}
                    aria-label="Unidad de medida"
                  >
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {unitCatalog.getLabel(unit)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeItem(index)}
                    className="p-2.5 min-w-11 min-h-11 flex items-center justify-center text-muted hover:text-red-500 rounded-xl transition-colors ml-auto"
                    aria-label="Eliminar"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-baseline text-sm gap-2">
                  <span className="text-muted text-xs">
                    {formatCurrency(displayUnitCost)}/{unitCatalog.getShortLabel(recipeUnit)}
                    {recipeUnit !== material.unitType && (
                      <span className="ml-1 opacity-70">
                        (compra en {unitCatalog.getShortLabel(material.unitType)})
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatCurrency(cost)}
                  </span>
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
