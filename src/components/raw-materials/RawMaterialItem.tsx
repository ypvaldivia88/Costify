import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RawMaterial } from '@/domain/types';
import { UNIT_SHORT_LABELS } from '@/domain/constants';
import { formatCurrency } from '@/format/currency';
import { Card } from '@/components/ui/Card';
import { NumericField } from '@/components/ui/NumericField';
import { useTheme } from '@/context/ThemeContext';

interface RawMaterialItemProps {
  material: RawMaterial;
  onEdit: () => void;
  onDelete: () => void;
  onStockChange: (stockQuantity: number) => void;
}

export function RawMaterialItem({ material, onEdit, onDelete, onStockChange }: RawMaterialItemProps) {
  const { colors } = useTheme();
  const unitLabel = UNIT_SHORT_LABELS[material.unitType];

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.meta}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {material.name}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {new Date(material.timestamp).toLocaleDateString('es-CU')}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            Costo:{' '}
            <Text style={{ color: colors.brand, fontWeight: '700' }}>
              {formatCurrency(material.unitCost)}/{unitLabel}
            </Text>
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onEdit} style={[styles.action, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={{ color: colors.brand, fontWeight: '700' }}>Editar</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.action, { backgroundColor: colors.dangerMuted }]}>
            <Text style={{ color: colors.danger, fontWeight: '700' }}>Borrar</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.stockRow, { borderTopColor: colors.border }]}>
        <Text style={{ color: colors.foreground, fontWeight: '600' }}>Stock:</Text>
        <NumericField value={material.stockQuantity} onChange={onStockChange} style={styles.stockInput} />
        <Text style={{ color: colors.muted, fontSize: 12 }}>{unitLabel}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: 12 },
  meta: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '800' },
  actions: { gap: 6 },
  action: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  stockInput: { flex: 1 },
});
