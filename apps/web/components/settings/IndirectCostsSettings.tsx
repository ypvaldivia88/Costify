'use client';

import { useEffect, useState } from 'react';
import { Check, Edit2, Plus, Settings, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { DistributionCriteria, IndirectCost } from '@costify/shared/domain/types';
import { DISTRIBUTION_CRITERIA_LABELS } from '@costify/shared/domain/constants';
import { formatCurrency } from '@costify/shared/format/currency';
import { fieldClassNameCompact } from '@/lib/ui/field-styles';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { NumericField } from '@/components/ui/NumericField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';

interface IndirectCostsSettingsProps {
  costs: IndirectCost[];
  onSave: (costs: IndirectCost[]) => void;
}

export function IndirectCostsSettings({ costs, onSave }: IndirectCostsSettingsProps) {
  const { confirm } = useConfirm();
  const [localCosts, setLocalCosts] = useState<IndirectCost[]>(costs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<IndirectCost>>({});
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    setLocalCosts(costs);
  }, [costs]);

  const startEdit = (cost: IndirectCost) => {
    setEditingId(cost.id);
    setDraft({ ...cost });
    setDraftError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
    setDraftError(null);
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (draft.distributionCriteria === 'manual' && (draft.distributionUnits ?? 0) <= 0) {
      setDraftError('Ingresa las unidades para distribuir el gasto');
      return;
    }
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

  const deleteCost = async (cost: IndirectCost) => {
    const confirmed = await confirm({
      title: 'Eliminar gasto',
      message: `¿Eliminar "${cost.name}" de las plantillas globales?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmed) return;
    const updated = localCosts.filter((c) => c.id !== cost.id);
    setLocalCosts(updated);
    onSave(updated);
    if (editingId === cost.id) cancelEdit();
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
              className="text-center py-10 text-muted text-sm"
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
                className="p-3 rounded-xl border border-border bg-surface-muted/50"
              >
                {editingId === cost.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={draft.name ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      className={cn('w-full', fieldClassNameCompact)}
                      placeholder="Nombre del gasto"
                      autoFocus
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <NumericField
                        value={draft.amount ?? 0}
                        onChange={(amount) => setDraft((d) => ({ ...d, amount }))}
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
                        className={fieldClassNameCompact}
                      >
                        {Object.entries(DISTRIBUTION_CRITERIA_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {draft.distributionCriteria === 'manual' && (
                      <NumericField
                        value={draft.distributionUnits ?? 0}
                        onChange={(distributionUnits) =>
                          setDraft((d) => ({ ...d, distributionUnits }))
                        }
                        placeholder="Unidades para distribuir"
                        className="w-full"
                      />
                    )}
                    {draftError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{draftError}</p>
                    )}
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="p-2.5 min-w-11 min-h-11 text-brand hover:bg-brand-muted rounded-lg"
                        aria-label="Guardar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="p-2.5 min-w-11 min-h-11 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                        aria-label="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{cost.name}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {formatCurrency(cost.amount)}/mes ·{' '}
                        {DISTRIBUTION_CRITERIA_LABELS[cost.distributionCriteria ?? 'manual']}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(cost)}
                        className="p-2.5 min-w-11 min-h-11 text-muted hover:text-foreground hover:bg-surface-muted rounded-lg"
                        aria-label="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCost(cost)}
                        className="p-2.5 min-w-11 min-h-11 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
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
