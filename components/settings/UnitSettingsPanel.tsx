'use client';

import { useEffect, useState } from 'react';
import { Check, Edit2, Plus, Ruler, RotateCcw, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ProductCalculation, RawMaterial, UnitDefinition, UnitFamily, UnitSettings } from '@/lib/domain/types';
import {
  DEFAULT_UNIT_SETTINGS,
  canDeleteUnit,
  collectUsedUnitIds,
  createCustomUnitId,
  getUnitFamilyLabels,
} from '@/lib/domain/unit-settings';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { NumericField } from '@/components/ui/NumericField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';

interface UnitSettingsPanelProps {
  settings: UnitSettings;
  rawMaterials: RawMaterial[];
  inventory: ProductCalculation[];
  onSave: (settings: UnitSettings) => void;
  onReset: () => void;
}

const FAMILY_OPTIONS: UnitFamily[] = ['count', 'weight', 'volume'];

type DraftUnit = Partial<UnitDefinition> & { isNew?: boolean };

export function UnitSettingsPanel({
  settings,
  rawMaterials,
  inventory,
  onSave,
  onReset,
}: UnitSettingsPanelProps) {
  const { confirm } = useConfirm();
  const [localSettings, setLocalSettings] = useState<UnitSettings>(settings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftUnit>({});
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const usedUnitIds = collectUsedUnitIds(rawMaterials, inventory);
  const familyLabels = getUnitFamilyLabels();

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
    setDraftError(null);
  };

  const startEdit = (unit: UnitDefinition) => {
    setEditingId(unit.id);
    setDraft({ ...unit });
    setDraftError(null);
  };

  const startAdd = () => {
    const newUnit: UnitDefinition = {
      id: createCustomUnitId('nueva'),
      label: 'Nueva unidad',
      shortLabel: 'ud',
      family: 'count',
      factor: 1,
    };
    const updated = { units: [...localSettings.units, newUnit] };
    setLocalSettings(updated);
    setEditingId(newUnit.id);
    setDraft({ ...newUnit, isNew: true });
    setDraftError(null);
  };

  const validateDraft = (): string | null => {
    if (!draft.label?.trim()) return 'Ingresa el nombre de la unidad';
    if (!draft.shortLabel?.trim()) return 'Ingresa la abreviatura';
    if (!draft.family) return 'Selecciona el tipo de unidad';
    if (draft.family !== 'count' && (draft.factor ?? 0) <= 0) {
      return 'Ingresa un factor de conversión mayor a cero';
    }
    return null;
  };

  const saveEdit = () => {
    if (!editingId) return;
    const error = validateDraft();
    if (error) {
      setDraftError(error);
      return;
    }

    const updatedUnit: UnitDefinition = {
      id: editingId,
      label: draft.label!.trim(),
      shortLabel: draft.shortLabel!.trim(),
      family: draft.family!,
      factor: draft.family === 'count' ? 1 : (draft.factor ?? 1),
      builtin: draft.builtin,
    };

    const updated = {
      units: localSettings.units.map((unit) => (unit.id === editingId ? updatedUnit : unit)),
    };
    setLocalSettings(updated);
    onSave(updated);
    cancelEdit();
  };

  const removeUnit = async (unit: UnitDefinition) => {
    const check = canDeleteUnit(unit, usedUnitIds);
    if (!check.allowed) {
      setDraftError(check.reason ?? 'No se puede eliminar esta unidad.');
      return;
    }

    const confirmed = await confirm({
      title: 'Eliminar unidad',
      message: `¿Eliminar "${unit.label}"?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmed) return;

    const updated = { units: localSettings.units.filter((item) => item.id !== unit.id) };
    setLocalSettings(updated);
    onSave(updated);
    if (editingId === unit.id) cancelEdit();
  };

  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Restaurar unidades',
      message:
        'Se restaurarán las unidades predeterminadas. Las unidades personalizadas se eliminarán.',
      confirmLabel: 'Restaurar',
      variant: 'primary',
    });
    if (!confirmed) return;
    setLocalSettings(DEFAULT_UNIT_SETTINGS);
    onReset();
    cancelEdit();
  };

  return (
    <Card>
      <SectionHeader
        icon={Ruler}
        title="Unidades de medida"
        description="Gestiona las unidades disponibles para materias primas y recetas"
      />

      <div className="space-y-3">
        {localSettings.units.map((unit) => {
          const isEditing = editingId === unit.id;
          const deleteCheck = canDeleteUnit(unit, usedUnitIds);

          return (
            <div
              key={unit.id}
              className="rounded-xl border border-border bg-surface/50 overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-3 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted">Nombre</label>
                        <input
                          type="text"
                          value={draft.label ?? ''}
                          onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                          className="mt-0.5 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted">Abreviatura</label>
                        <input
                          type="text"
                          value={draft.shortLabel ?? ''}
                          onChange={(e) => setDraft((d) => ({ ...d, shortLabel: e.target.value }))}
                          className="mt-0.5 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted">Tipo</label>
                        <select
                          value={draft.family ?? 'count'}
                          disabled={draft.builtin}
                          onChange={(e) => {
                            const family = e.target.value as UnitFamily;
                            setDraft((d) => ({
                              ...d,
                              family,
                              factor: family === 'count' ? 1 : d.factor ?? 1,
                            }));
                          }}
                          className="mt-0.5 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm disabled:opacity-60"
                        >
                          {FAMILY_OPTIONS.map((family) => (
                            <option key={family} value={family}>
                              {familyLabels[family]}
                            </option>
                          ))}
                        </select>
                      </div>
                      {draft.family !== 'count' && (
                        <div>
                          <label className="text-xs text-muted">
                            Factor ({draft.family === 'weight' ? 'gramos' : 'mililitros'} por unidad)
                          </label>
                          <NumericField
                            value={draft.factor ?? 1}
                            disabled={draft.builtin}
                            onChange={(factor) => setDraft((d) => ({ ...d, factor }))}
                            className="mt-0.5 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm min-h-9 disabled:opacity-60"
                          />
                        </div>
                      )}
                    </div>

                    {draftError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{draftError}</p>
                    )}

                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={saveEdit}>
                        <Check className="w-4 h-4" />
                        Guardar
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => {
                        if (draft.isNew) {
                          const updated = {
                            units: localSettings.units.filter((item) => item.id !== editingId),
                          };
                          setLocalSettings(updated);
                        }
                        cancelEdit();
                      }}>
                        <X className="w-4 h-4" />
                        Cancelar
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{unit.label}</p>
                      <p className="text-xs text-muted">
                        {unit.shortLabel} · {familyLabels[unit.family]}
                        {unit.family !== 'count' && ` · factor ${unit.factor}`}
                        {unit.builtin && ' · predeterminada'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(unit)}
                        className="p-2 text-muted hover:text-foreground rounded-lg transition-colors"
                        aria-label={`Editar ${unit.label}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!unit.builtin && (
                        <button
                          type="button"
                          onClick={() => removeUnit(unit)}
                          disabled={!deleteCheck.allowed}
                          title={deleteCheck.reason}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            deleteCheck.allowed
                              ? 'text-muted hover:text-red-500'
                              : 'text-muted/40 cursor-not-allowed'
                          )}
                          aria-label={`Eliminar ${unit.label}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Añadir unidad
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors ml-auto"
        >
          <RotateCcw className="w-4 h-4" />
          Restaurar predeterminadas
        </button>
      </div>

      <p className="text-xs text-muted mt-4 leading-relaxed">
        Las unidades del mismo tipo (peso, volumen o conteo) se pueden convertir entre sí en las
        recetas. El factor indica cuántos gramos o mililitros equivalen a una unidad.
      </p>
    </Card>
  );
}
