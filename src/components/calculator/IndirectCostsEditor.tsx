import { Plus, Trash2 } from 'lucide-react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { DistributionCriteria, IndirectCost } from '@/domain/types';
import { DISTRIBUTION_CRITERIA_LABELS } from '@/domain/constants';
import { Button } from '@/components/ui/Button';
import { NumericField } from '@/components/ui/NumericField';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@/context/ThemeContext';
import { createId } from '@/utils/uuid';

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
  const { colors } = useTheme();

  const addCost = () => {
    onChange([
      ...costs,
      {
        id: createId(),
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

  return (
    <View style={styles.wrap}>
      <View style={styles.actions}>
        {showImport && onImportGlobal ? (
          <Button variant="outline" size="sm" onPress={onImportGlobal}>
            Importar
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onPress={addCost}>
          + Añadir
        </Button>
      </View>

      {costs.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted, borderColor: colors.border }]}>
          Sin gastos indirectos añadidos.
        </Text>
      ) : (
        costs.map((cost) => (
          <View
            key={cost.id}
            style={[styles.item, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
          >
            <TextInput
              placeholder="Nombre (ej. Alquiler)"
              placeholderTextColor={colors.muted}
              value={cost.name}
              onChangeText={(name) => updateCost(cost.id, 'name', name)}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            />
            <View style={styles.row}>
              <NumericField
                value={cost.amount}
                onChange={(amount) => updateCost(cost.id, 'amount', amount)}
                placeholder="Monto mensual"
                style={styles.half}
              />
              <View style={[styles.pickerWrap, styles.half, { borderColor: colors.border }]}>
                <Picker
                  selectedValue={cost.distributionCriteria}
                  onValueChange={(value) =>
                    updateCost(cost.id, 'distributionCriteria', value as DistributionCriteria)
                  }
                  style={{ color: colors.foreground }}
                >
                  {Object.entries(DISTRIBUTION_CRITERIA_LABELS).map(([value, label]) => (
                    <Picker.Item key={value} label={label} value={value} />
                  ))}
                </Picker>
              </View>
            </View>
            {cost.distributionCriteria === 'manual' ? (
              <NumericField
                value={cost.distributionUnits ?? 0}
                onChange={(distributionUnits) =>
                  updateCost(cost.id, 'distributionUnits', distributionUnits)
                }
                placeholder="Unidades para distribuir"
              />
            ) : null}
            <Button variant="outline" size="sm" onPress={() => onChange(costs.filter((c) => c.id !== cost.id))}>
              <Trash2 size={14} color={colors.danger} /> Eliminar
            </Button>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  empty: {
    textAlign: 'center',
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    fontStyle: 'italic',
  },
  item: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  pickerWrap: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', justifyContent: 'center' },
});
