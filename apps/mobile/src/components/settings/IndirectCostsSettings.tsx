import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Plus, Settings } from 'lucide-react-native';
import type { DistributionCriteria, IndirectCost } from '@costify/shared/domain/types';
import { DISTRIBUTION_CRITERIA_LABELS } from '@costify/shared/domain/constants';
import { formatCurrency } from '@costify/shared/format/currency';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NumericField } from '@/components/ui/NumericField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useConfirm } from '@/context/DialogContext';
import { useTheme } from '@/context/ThemeContext';
import { createId } from '@/utils/uuid';

interface IndirectCostsSettingsProps {
  costs: IndirectCost[];
  onSave: (costs: IndirectCost[]) => void;
}

export function IndirectCostsSettings({ costs, onSave }: IndirectCostsSettingsProps) {
  const { colors } = useTheme();
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
      id: createId(),
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
      <View style={styles.header}>
        <SectionHeader
          icon={Settings}
          title="Gastos indirectos globales"
          description="Plantillas reutilizables para importar en la calculadora"
        />
        <Button size="sm" onPress={addCost}>
          + Añadir
        </Button>
      </View>

      {localCosts.length === 0 ? (
        <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: 24 }}>
          No hay gastos configurados. Añade alquiler, servicios, transporte, etc.
        </Text>
      ) : (
        localCosts.map((cost) => (
          <View
            key={cost.id}
            style={[styles.item, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
          >
            {editingId === cost.id ? (
              <View style={styles.editForm}>
                <TextInput
                  value={draft.name ?? ''}
                  onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
                  placeholder="Nombre del gasto"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                />
                <NumericField
                  value={draft.amount ?? 0}
                  onChange={(amount) => setDraft((d) => ({ ...d, amount }))}
                  placeholder="Monto mensual"
                />
                <View style={[styles.pickerWrap, { borderColor: colors.border }]}>
                  <Picker
                    selectedValue={draft.distributionCriteria ?? 'units'}
                    onValueChange={(value) =>
                      setDraft((d) => ({ ...d, distributionCriteria: value as DistributionCriteria }))
                    }
                    style={{ color: colors.foreground }}
                  >
                    {Object.entries(DISTRIBUTION_CRITERIA_LABELS).map(([value, label]) => (
                      <Picker.Item key={value} label={label} value={value} />
                    ))}
                  </Picker>
                </View>
                {draft.distributionCriteria === 'manual' ? (
                  <NumericField
                    value={draft.distributionUnits ?? 0}
                    onChange={(distributionUnits) => setDraft((d) => ({ ...d, distributionUnits }))}
                    placeholder="Unidades para distribuir"
                  />
                ) : null}
                {draftError ? <Text style={{ color: colors.danger, fontSize: 12 }}>{draftError}</Text> : null}
                <View style={styles.editActions}>
                  <Button variant="secondary" size="sm" onPress={saveEdit}>
                    Guardar
                  </Button>
                  <Button variant="outline" size="sm" onPress={cancelEdit}>
                    Cancelar
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.viewRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: '700' }}>{cost.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                    {formatCurrency(cost.amount)}/mes ·{' '}
                    {DISTRIBUTION_CRITERIA_LABELS[cost.distributionCriteria ?? 'manual']}
                  </Text>
                </View>
                <Pressable onPress={() => startEdit(cost)} style={styles.smallBtn}>
                  <Text style={{ color: colors.brand, fontWeight: '700' }}>Editar</Text>
                </Pressable>
                <Pressable onPress={() => deleteCost(cost)} style={styles.smallBtn}>
                  <Text style={{ color: colors.danger, fontWeight: '700' }}>Borrar</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  item: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 10 },
  editForm: { gap: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  pickerWrap: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  editActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallBtn: { padding: 8 },
});
