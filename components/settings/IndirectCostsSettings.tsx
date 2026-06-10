'use client';

import { useEffect, useState } from 'react';
import { Check, Edit2, Plus, Settings, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { DistributionCriteria, IndirectCost } from '@/lib/domain/types';
import { DISTRIBUTION_CRITERIA_LABELS } from '@/lib/domain/constants';
import { formatCurrency } from '@/lib/format/currency';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface IndirectCostsSettingsProps {
  costs: IndirectCost[];
  onSave: (costs: IndirectCost[]) => void;
}

export function IndirectCostsSettings({ costs, onSave }: IndirectCostsSettingsProps) {
  const [localCosts, setLocalCosts] = useState<IndirectCost[]>(costs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<IndirectCost>>({});

  useEffect(() => {
    setLocalCosts(costs);
  }, [costs]);

  const startEdit = (cost: IndirectCost) => {
    setEditingId(cost.id);
    setDraft({ ...cost });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = localCosts.map((c) =>
      c.id === editingId
        ? {
            ...c,
            name: draft.name ?? c.name,
            amount: draft.amount ?? c.amount,
            distributionCriteria: (draft.distributionCriteria ?? c.distributionCriteria) as DistributionCriteria,
            distributionUnits:
              (draft.distributionCriteria ?? c.distributionCriteria) === 'manual'
                ? draft.distributionUnits ?? c.distributionUnits ?? 1
                : undefined,
          }
        : c
    );
    setLocalCosts(updated);
    onSave(updated);
    cancelEdit();
  };

  const addCost = () => {
    const newCost: IndirectCost = {
      id: crypto.randomUUID(),
      name: 'Nuevo gasto',
      amount: 0,
      distributionCriteria: 'units',
    };
    const updated = [...localCosts, newCost];
    setLocalCosts(updated);
    startEdit(newCost);
  };

  const deleteCost = (id: string) => {
    const updated = localCosts.filter((c) => c.id !== id);
    setLocalCosts(updated);
    onSave(updated);
    if (editingId === id) cancelEdit();
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-4">
        <SectionHeader
          icon={Settings}
          title="Gastos indirectos globales"
          description="Plantillas reutilizables para importar en la calculadora"
        />
        <Button size="sm" onClick={addCost} className="shrink-0 mt-1">
          <Plus className="w-4 h-4" /> Añadir
        </Button>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {localCosts.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-zinc-400 text-sm italic"
            >
              No hay gastos configurados. Añade alquiler, servicios, transporte, etc.
            </motion.p>
          ) : (
            localCosts.map((cost) => (
              <motion.div
                key={cost.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50"
              >
                {editingId === cost.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={draft.name ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:border-emerald-500 min-h-11"
                      placeholder="Nombre del gasto"
                      autoFocus
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={draft.amount ?? ''}
                        onChange={(e) => setDraft((d) => ({ ...d, amount: Number(e.target.value) }))}
                        className="px-3 py-2.5 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:border-emerald-500 min-h-11"
                        placeholder="Monto mensual"
                      />
                      <select
                        value={draft.distributionCriteria ?? 'units'}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            distributionCriteria: e.target.value as DistributionCriteria,
                          }))
                        }
                        className="px-3 py-2.5 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:border-emerald-500 min-h-11"
                      >
                        {Object.entries(DISTRIBUTION_CRITERIA_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {draft.distributionCriteria === 'manual' && (
                      <input
                        type="number"
                        value={draft.distributionUnits ?? ''}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            distributionUnits: Math.max(1, Number(e.target.value)),
                          }))
                        }
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:border-emerald-500 min-h-11"
                        placeholder="Unidades para distribuir"
                      />
                    )}
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={saveEdit}
                        className="p-2.5 min-w-11 min-h-11 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        aria-label="Guardar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2.5 min-w-11 min-h-11 text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-900 truncate">{cost.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {formatCurrency(cost.amount)}/mes ·{' '}
                        {DISTRIBUTION_CRITERIA_LABELS[cost.distributionCriteria ?? 'manual']}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(cost)}
                        className="p-2.5 min-w-11 min-h-11 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg"
                        aria-label="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCost(cost.id)}
                        className="p-2.5 min-w-11 min-h-11 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
