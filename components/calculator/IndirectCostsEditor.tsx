'use client';

import { Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { DistributionCriteria, IndirectCost } from '@/lib/domain/types';
import { DISTRIBUTION_CRITERIA_LABELS } from '@/lib/domain/constants';
import { Button } from '@/components/ui/Button';

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
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-700">Gastos indirectos del período</p>
          <p className="text-xs text-zinc-500">Alquiler, transporte, servicios, etc.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {showImport && onImportGlobal && (
            <Button variant="outline" size="sm" onClick={onImportGlobal} type="button">
              Importar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={addCost} type="button">
            <Plus className="w-3.5 h-3.5" /> Añadir
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {costs.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-zinc-400 italic py-4 text-center border border-dashed border-zinc-200 rounded-xl"
            >
              Sin gastos indirectos. Añade los costos fijos mensuales de tu negocio.
            </motion.p>
          ) : (
            costs.map((cost) => (
              <motion.div
                key={cost.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2"
              >
                <input
                  type="text"
                  placeholder="Nombre (ej. Alquiler local)"
                  value={cost.name}
                  onChange={(e) => updateCost(cost.id, 'name', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:border-emerald-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Monto mensual"
                    value={cost.amount || ''}
                    onChange={(e) => updateCost(cost.id, 'amount', Number(e.target.value))}
                    className="px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={cost.distributionCriteria}
                    onChange={(e) =>
                      updateCost(cost.id, 'distributionCriteria', e.target.value as DistributionCriteria)
                    }
                    className="px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:border-emerald-500"
                  >
                    {Object.entries(DISTRIBUTION_CRITERIA_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {cost.distributionCriteria === 'manual' && (
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Unidades para distribuir"
                    value={cost.distributionUnits || ''}
                    onChange={(e) =>
                      updateCost(cost.id, 'distributionUnits', Math.max(1, Number(e.target.value)))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:border-emerald-500"
                  />
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeCost(cost.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
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
