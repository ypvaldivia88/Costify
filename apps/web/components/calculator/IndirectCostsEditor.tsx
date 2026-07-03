'use client';

import { Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { DistributionCriteria, IndirectCost } from '@costify/shared/domain/types';
import { DISTRIBUTION_CRITERIA_LABELS } from '@costify/shared/domain/constants';
import { Button } from '@/components/ui/Button';
import { NumericField } from '@/components/ui/NumericField';
import { fieldClassNameCompact, iconButtonDangerClassName } from '@/lib/ui/field-styles';
import { cn } from '@/lib/utils';

interface IndirectCostsEditorProps {
  costs: IndirectCost[];
  onChange: (costs: IndirectCost[]) => void;
  onImportGlobal?: () => void;
  showImport?: boolean;
}

export function IndirectCostsEditor({
  costs,
  onChange,
  onImportGlobal,
  showImport,
}: IndirectCostsEditorProps) {
  const addCost = () => {
    onChange([
      ...costs,
      {
        id: crypto.randomUUID(),
        name: '',
        amount: 0,
        distributionCriteria: 'units',
        distributionUnits: 1,
      },
    ]);
  };

  const updateCost = (id: string, field: keyof IndirectCost, value: string | number) => {
    onChange(costs.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const removeCost = (id: string) => {
    onChange(costs.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        {showImport && onImportGlobal && (
          <Button variant="outline" size="sm" onClick={onImportGlobal} type="button">
            Importar
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={addCost} type="button">
          <Plus className="w-3.5 h-3.5" /> Añadir
        </Button>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {costs.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted italic py-4 text-center border border-dashed border-border rounded-xl"
            >
              Sin gastos indirectos añadidos.
            </motion.p>
          ) : (
            costs.map((cost) => (
              <motion.div
                key={cost.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 rounded-xl border border-border bg-surface-muted/50 space-y-2"
              >
                <input
                  type="text"
                  placeholder="Nombre (ej. Alquiler)"
                  value={cost.name}
                  onChange={(e) => updateCost(cost.id, 'name', e.target.value)}
                  className={cn('w-full', fieldClassNameCompact)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <NumericField
                    value={cost.amount}
                    onChange={(amount) => updateCost(cost.id, 'amount', amount)}
                    placeholder="Monto mensual"
                    className={fieldClassNameCompact}
                  />
                  <select
                    value={cost.distributionCriteria}
                    onChange={(e) =>
                      updateCost(cost.id, 'distributionCriteria', e.target.value as DistributionCriteria)
                    }
                    className={fieldClassNameCompact}
                  >
                    {Object.entries(DISTRIBUTION_CRITERIA_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {cost.distributionCriteria === 'manual' && (
                  <NumericField
                    value={cost.distributionUnits ?? 0}
                    onChange={(distributionUnits) =>
                      updateCost(cost.id, 'distributionUnits', distributionUnits)
                    }
                    placeholder="Unidades para distribuir"
                    className={cn('w-full', fieldClassNameCompact)}
                  />
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeCost(cost.id)}
                    className={iconButtonDangerClassName}
                    aria-label="Eliminar gasto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
