import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ProductCalculation, TaxSettings } from '@costify/shared/domain/types';
import { calculateBusinessSummary } from '@costify/shared/domain/calculations';
import { BusinessSummaryCard } from '@/components/inventory/BusinessSummaryCard';
import { InventoryItem } from '@/components/inventory/InventoryItem';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/context/DialogContext';
import { useTheme } from '@/context/ThemeContext';

interface InventoryListProps {
  items: ProductCalculation[];
  taxSettings: TaxSettings;
  onDelete: (id: string) => void;
  onEdit: (item: ProductCalculation) => void;
  onRecalculateAll: () => void;
}

export function InventoryList({
  items,
  taxSettings,
  onDelete,
  onEdit,
  onRecalculateAll,
}: InventoryListProps) {
  const { colors } = useTheme();
  const { confirm } = useConfirm();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const summary = calculateBusinessSummary(items, taxSettings);

  const handleDelete = async (item: ProductCalculation) => {
    const confirmed = await confirm({
      title: 'Eliminar producto',
      message: `¿Eliminar "${item.name}" del historial? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (confirmed) onDelete(item.id);
  };

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 16 }}>Sin productos guardados</Text>
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 6 }}>
          Usa la calculadora para crear tu primera ficha de costos.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={{ color: colors.muted, fontWeight: '700' }}>
          {items.length} producto{items.length !== 1 ? 's' : ''}
        </Text>
        <Button variant="outline" size="sm" onPress={onRecalculateAll}>
          Recalcular
        </Button>
      </View>

      <BusinessSummaryCard summary={summary} taxSettings={taxSettings} />

      {items.map((item) => (
        <InventoryItem
          key={item.id}
          item={item}
          expanded={expandedId === item.id}
          taxSettings={taxSettings}
          onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
          onEdit={() => onEdit(item)}
          onDelete={() => handleDelete(item)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: {
    margin: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
});
