'use client';

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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
  showStockHints?: boolean;
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

export function RecipeEditor({ recipe, rawMaterials, onChange, showStockHints = true }: RecipeEditorProps) {
  const unitCatalog = useUnitCatalog();
  const unitSettings = unitCatalog.settings;
  const [showPicker, setShowPicker] = useState(false);

  const usedIds = new Set(recipe.map((r) => r.rawMaterialId));
  const availableMaterials = rawMaterials.filter((m) => !usedIds.has(m.id));

  const addItem = (rawMaterialId: string) => {
    const material = rawMaterials.find((m) => m.id === rawMaterialId);
    if (!material) return;

    onChange([
      { rawMaterialId: material.id, quantity: 1, unitType: material.unitType },
      ...recipe,
    ]);
    setShowPicker(false);
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
          onClick={() => setShowPicker((open) => !open)}
          disabled={availableMaterials.length === 0}
          type="button"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </Button>
      </div>

      <AnimatePresence>
        {showPicker && availableMaterials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-brand/30 bg-brand-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Selecciona un insumo</p>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="p-1.5 text-muted hover:text-foreground rounded-lg transition-colors"
                  aria-label="Cerrar listado"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {availableMaterials.map((material) => (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => addItem(material.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-border bg-surface hover:border-brand hover:bg-brand-muted/40 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{material.name}</span>
                    <span className="text-xs text-muted ml-2">
                      {formatCurrency(material.unitCost)}/{unitCatalog.getShortLabel(material.unitType)}
                      {showStockHints && (
                        <span className="ml-1">
                          · {material.stockQuantity.toLocaleString('es-CU')} en stock
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            const selectableMaterials = rawMaterials.filter(
              (m) => m.id === item.rawMaterialId || !usedIds.has(m.id)
            );

            return (
              <div
                key={item.rawMaterialId}
                className="p-3 rounded-xl border border-border bg-surface-muted/50 space-y-2"
              >
                <select
                  value={item.rawMaterialId}
                  onChange={(e) => changeMaterial(index, e.target.value)}
                  className={cn('w-full', fieldClassNameCompact)}
                >
                  {selectableMaterials.map((m) => (
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
                    {showStockHints && (
                      <span
                        className={`ml-2 ${
                          material.stockQuantity <= 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-muted'
                        }`}
                      >
                        · Stock: {material.stockQuantity.toLocaleString('es-CU')}{' '}
                        {unitCatalog.getShortLabel(material.unitType)}
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
